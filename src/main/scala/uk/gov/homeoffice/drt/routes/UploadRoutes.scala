package uk.gov.homeoffice.drt.routes

import akka.http.scaladsl.model.{ HttpResponse, StatusCode }
import akka.http.scaladsl.model.StatusCodes.{ BadRequest, Forbidden, InternalServerError, MethodNotAllowed }
import akka.http.scaladsl.server.Directives.{ complete, fileUpload, onSuccess, pathPrefix, post, _ }
import akka.http.scaladsl.server.directives.FileInfo
import akka.http.scaladsl.server.{ Route, _ }
import akka.stream.Materializer
import akka.stream.scaladsl.{ Framing, Source }
import akka.util.ByteString
import org.joda.time.format.DateTimeFormat
import org.joda.time.{ DateTime, DateTimeZone }
import org.slf4j.{ Logger, LoggerFactory }
import uk.gov.homeoffice.drt.Dashboard._
import uk.gov.homeoffice.drt.HttpClient
import uk.gov.homeoffice.drt.auth.Roles.NeboUpload
import uk.gov.homeoffice.drt.routes.ApiRoutes.authByRole
import uk.gov.homeoffice.drt.routes.UploadRoutes.MillisSinceEpoch

import scala.concurrent.{ ExecutionContextExecutor, Future }

case class Row(urnReference: String, associatedText: String, flightCode: String, arrivalPort: String, date: String)

case class FlightData(portCode: String, flightCode: String, scheduled: MillisSinceEpoch, paxCount: Int)

object UploadRoutes {

  type MillisSinceEpoch = Long

  val log: Logger = LoggerFactory.getLogger(getClass)

  val drtRoutePath = "/data/feeds/red-list-counts"

  implicit def rejectionHandler =
    RejectionHandler.newBuilder()
      .handle {
        case AuthorizationFailedRejection =>
          complete(Forbidden, "You are not authorized to upload!")
      }
      .handle {
        case ValidationRejection(msg, _) =>
          complete(InternalServerError, "Not valid data!" + msg)
      }
      .handleAll[MethodRejection] { methodRejections =>
        val names = methodRejections.map(_.supported.name)
        complete(MethodNotAllowed, s"Not supported: ${names mkString " or "}!")
      }
      .handleNotFound {
        complete("Not found!")
      }
      .result()

  def apply(prefix: String, neboPortCodes: List[String], httpClient: HttpClient)(implicit ec: ExecutionContextExecutor, mat: Materializer): Route = {
    val route: Route =
      authByRole(NeboUpload) {
        pathPrefix(prefix) {
          post {
            fileUpload("csv") {
              case (metadata, byteSource) =>
                onSuccess(
                  Future.sequence(
                    neboPortCodes
                      .map(sendFlightDataToPort(
                        convertByteSourceToFlightData(metadata, byteSource), _, httpClient))))(response => complete(s"Posted to DRT with status ${response.map(r => r._1 -> r._2)}"))
            }
          }
        }
      }

    handleRejections(rejectionHandler)(route)
  }

  def sendFlightDataToPort(flightData: Future[List[FlightData]], portCode: String, httpClient: HttpClient)(implicit ec: ExecutionContextExecutor, mat: Materializer): Future[(String, StatusCode)] = {
    flightData.flatMap { fd =>
      val httpRequest = httpClient
        .createDrtNeboRequest(
          fd.filter(_.portCode.toLowerCase == portCode.toLowerCase), s"${drtUriForPortCode(portCode)}$drtRoutePath")
      httpClient.send(httpRequest)
    }.map(r => portCode -> r.status)
  }

  def convertByteSourceToFlightData(metadata: FileInfo, byteSource: Source[ByteString, Any])(implicit ec: ExecutionContextExecutor, mat: Materializer) = {
    byteSource.via(Framing.delimiter(ByteString("\n"), maximumFrameLength = 2048, allowTruncation = true))
      .map(convertByteStringToRow)
      .runFold(List.empty[Row]) { (r, n) => r :+ n }
      .map(rowToJson(_, metadata))
  }

  private def convertByteStringToRow(byteString: ByteString): Row = {
    val indexMapRow: Map[Int, String] = byteString.utf8String.split(",")
      .zipWithIndex
      .toMap
      .map { case (k, v) => v -> k }

    Row(
      indexMapRow.getOrElse(0, "").trim,
      indexMapRow.getOrElse(1, "").trim,
      indexMapRow.getOrElse(2, "").trim,
      indexMapRow.getOrElse(3, "").trim,
      indexMapRow.getOrElse(4, "").trim)
  }

  private def rowToJson(rows: List[Row], metadata: FileInfo): List[FlightData] = {
    val dataRows: Seq[Row] = rows.tail.filterNot(_.flightCode.isEmpty)
    log.info(s"Processing ${dataRows.size} rows from the file name `${metadata.fileName}`")
    dataRows.groupBy(_.arrivalPort)
      .flatMap { arrivalPort =>
        arrivalPort._2.groupBy(_.flightCode)
          .map(flightCode => FlightData(arrivalPort._1, flightCode._1, covertDateTime(flightCode._2.head.date), flightCode._2.size))
      }.toList
  }

  val covertDateTime: String => MillisSinceEpoch = date => if (date.isEmpty) 0 else DateTime
    .parse(date, DateTimeFormat.forPattern("dd/MM/yyyy HH:mm:ss"))
    .withZone(DateTimeZone.UTC)
    .getMillis

}
