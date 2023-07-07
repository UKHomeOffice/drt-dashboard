package uk.gov.homeoffice.drt.routes

import akka.http.scaladsl.common.{CsvEntityStreamingSupport, EntityStreamingSupport}
import akka.http.scaladsl.model.headers.ContentDispositionTypes.attachment
import akka.http.scaladsl.model.headers.`Content-Disposition`
import akka.http.scaladsl.model.{ContentType, ContentTypes}
import akka.http.scaladsl.server.Directives.{complete, _}
import akka.http.scaladsl.server.{Route, ValidationRejection}
import akka.stream.Materializer
import akka.stream.scaladsl.Source
import akka.util.ByteString
import uk.gov.homeoffice.drt.HttpClient
import uk.gov.homeoffice.drt.arrivals.ArrivalExportHeadings
import uk.gov.homeoffice.drt.ports.PortRegion
import uk.gov.homeoffice.drt.ports.config.AirportConfigs
import uk.gov.homeoffice.drt.rccu.ExportCsvService
import uk.gov.homeoffice.drt.services.s3.S3Uploader

import scala.concurrent.ExecutionContextExecutor

object ExportRoutes {
  def apply(httpClient: HttpClient, s3Uploader: S3Uploader)
           (implicit ec: ExecutionContextExecutor, mat: Materializer): Route = {
    lazy val exportCsvService = new ExportCsvService(httpClient)
    path("export" / Segment / Segment / Segment) { (region, startDate, endDate) =>
      val fileName = exportCsvService.makeFileName(startDate, endDate, region)
      exportCsvService.getPortRegion(region).map { portRegion: PortRegion =>

        val stream = Source(portRegion.ports.toList.sortBy(_.iata))
          .map { port =>
            AirportConfigs.confByPort.get(port).map(config => (port.iata, config.terminals))
          }
          .mapConcat {
            case Some((portStr, terminals)) => terminals.map(t => (portStr, t))
          }
          .mapAsync(1) {
            case (port, terminal) =>
              exportCsvService.getPortResponseForTerminal(startDate, endDate, portRegion.name, port, terminal.toString)
          }
          .flatMapConcat(identity)
          .prepend(Source.single(ByteString(ArrivalExportHeadings.regionalExportHeadings)))
        s3Uploader.upload(fileName, stream)

        complete("ok")
      }.getOrElse(reject(ValidationRejection("Region not found.")))
    }
  }

  val contentType: ContentType.WithCharset = ContentTypes.`text/plain(UTF-8)`

  implicit val streamingSupport: CsvEntityStreamingSupport = EntityStreamingSupport.csv().withContentType(contentType)
}
