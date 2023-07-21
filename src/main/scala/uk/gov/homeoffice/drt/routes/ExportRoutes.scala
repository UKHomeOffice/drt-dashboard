package uk.gov.homeoffice.drt.routes

import akka.Done
import akka.http.scaladsl.common.{CsvEntityStreamingSupport, EntityStreamingSupport}
import akka.http.scaladsl.marshallers.sprayjson.SprayJsonSupport._
import akka.http.scaladsl.marshalling.{Marshaller, ToEntityMarshaller}
import akka.http.scaladsl.model.headers.ContentDispositionTypes.attachment
import akka.http.scaladsl.model.headers.`Content-Disposition`
import akka.http.scaladsl.model.{ContentTypes, HttpEntity}
import akka.http.scaladsl.server.Directives._
import akka.http.scaladsl.server.{Route, StandardRoute, ValidationRejection}
import akka.stream.Materializer
import akka.stream.scaladsl.{Flow, Source}
import akka.util.ByteString
import org.slf4j.LoggerFactory
import uk.gov.homeoffice.drt.HttpClient
import uk.gov.homeoffice.drt.arrivals.ArrivalExportHeadings
import uk.gov.homeoffice.drt.db.{AppDatabase, RegionExportQueries}
import uk.gov.homeoffice.drt.json.RegionExportJsonFormats._
import uk.gov.homeoffice.drt.models.RegionExport
import uk.gov.homeoffice.drt.ports.PortRegion
import uk.gov.homeoffice.drt.ports.config.AirportConfigs
import uk.gov.homeoffice.drt.rccu.ExportCsvService
import uk.gov.homeoffice.drt.time.{LocalDate, SDateLike}

import scala.concurrent.{ExecutionContext, ExecutionContextExecutor, Future}
import scala.util.{Failure, Success}


object ExportRoutes {
  private val log = LoggerFactory.getLogger(getClass)

  case class RegionExportRequest(region: String, startDate: LocalDate, endDate: LocalDate)

  implicit val csvStreaming: CsvEntityStreamingSupport = EntityStreamingSupport.csv().withFramingRenderer(Flow[ByteString])
  implicit val csvMarshaller: ToEntityMarshaller[ByteString] =
    Marshaller.withFixedContentType(ContentTypes.`text/csv(UTF-8)`) { bytes =>
      HttpEntity(ContentTypes.`text/csv(UTF-8)`, bytes)
    }

  def apply(httpClient: HttpClient,
            upload: (String, Source[ByteString, Any]) => Future[Done],
            download: String => Future[Source[ByteString, _]],
            now: () => SDateLike,
            database: AppDatabase,
           )
           (implicit ec: ExecutionContextExecutor, mat: Materializer): Route = {
    lazy val exportCsvService = ExportCsvService(httpClient)
    headerValueByName("X-Auth-Email") { email =>
      pathPrefix("export")(
        concat(
          post(
            entity(as[RegionExportRequest]) { exportRequest =>
              handleRegionExport(upload, exportCsvService, email, exportRequest, now, database)
            }
          ),
          get {
            concat(
              path(Segment) { region =>
                complete(database.db.run(RegionExportQueries.getAll(email, region)))
              },
              path(Segment / Segment) { case (region, createdAt) =>
                onComplete(getExportRoute(email, region, createdAt, exportCsvService, download, database)) {
                  case Success(route) => route
                  case Failure(e) =>
                    log.error("Failed to get region export", e)
                    complete("Failed to get region export")
                }
              }
            )
          }
        )
      )
    }
  }

  private def getExportRoute(email: String,
                             region: String,
                             createdAt: String,
                             exportCsvService: ExportCsvService,
                             downloader: String => Future[Source[ByteString, _]],
                             database: AppDatabase,
                            )
                            (implicit ec: ExecutionContextExecutor): Future[Route] = {
    log.info(s"Getting region export for $email / $region / $createdAt")

    database.db.run(RegionExportQueries.get(email, region, createdAt.toLong))
      .flatMap {
        case Some(regionExport) =>
          val startDateString = regionExport.startDate.toString()
          val endDateString = regionExport.endDate.toString()
          val fileName = s"exports/${exportCsvService.makeFileName(startDateString, endDateString, regionExport.region, regionExport.createdAt)}"
          log.info(s"Downloading $fileName")
          downloader(fileName).map { stream =>
            respondWithHeader(`Content-Disposition`(attachment, Map("filename" -> fileName))) {
              complete(stream)
            }
          }
        case None =>
          Future.successful(complete("Region export not found"))
      }
  }

  private def handleRegionExport(upload: (String, Source[ByteString, Any]) => Future[Done],
                                 exportCsvService: => ExportCsvService,
                                 email: String,
                                 exportRequest: RegionExportRequest,
                                 now: () => SDateLike,
                                 database: AppDatabase,
                                )
                                (implicit ec: ExecutionContextExecutor, mat: Materializer): StandardRoute = {
    val startDateString = exportRequest.startDate.toString()
    val endDateString = exportRequest.endDate.toString()
    val creationDate = now()
    val fileName = exportCsvService.makeFileName(startDateString, endDateString, exportRequest.region, creationDate)
    exportCsvService.getPortRegion(exportRequest.region).map { portRegion: PortRegion =>
      val regionExport = RegionExport(email, portRegion.name, exportRequest.startDate, exportRequest.endDate, "preparing", creationDate)
      database.db.run(RegionExportQueries.insert(regionExport))
        .map(_ => log.info("Region export inserted"))
        .recover { case e => log.error("Failed to insert region export", e) }

      val stream = Source(portRegion.ports.toList.sortBy(_.iata))
        .map { port =>
          AirportConfigs.confByPort.get(port).map(config => (port.iata, config.terminals))
        }
        .mapConcat {
          case Some((portStr, terminals)) => terminals.map(t => (portStr, t))
        }
        .mapAsync(1) {
          case (port, terminal) =>
            exportCsvService
              .getPortResponseForTerminal(startDateString, endDateString, portRegion.name, port, terminal.toString)
              .recover { e =>
                log.error(s"Failed to get port response for $port $terminal", e)

                updateExportStatus(regionExport, "failed", database)

                throw new Exception("Failed to get port response")
              }
        }
        .prepend(Source.single(ByteString(ArrivalExportHeadings.regionalExportHeadings + "\n")))

      upload(fileName, stream).onComplete {
        case Success(_) =>
          updateExportStatus(regionExport, "complete", database)
          log.info("Export complete")
        case Failure(exception) =>
          updateExportStatus(regionExport, "failed", database)
          log.error("Failed to create export", exception)
      }
      complete("ok")
    }.getOrElse(reject(ValidationRejection("Region not found.")))
  }

  private def updateExportStatus(regionExport: RegionExport, status: String, database: AppDatabase)
                                (implicit ec: ExecutionContext): Future[Boolean] = {
    val updatedRegionExport = regionExport.copy(status = status)
    database.db.run(RegionExportQueries.update(updatedRegionExport))
      .map { _ =>
        log.info("Region export updated")
        true
      }
      .recover {
        case e =>
          log.error("Failed to update region export", e)
          false
      }
  }
}
