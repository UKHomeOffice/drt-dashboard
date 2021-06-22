package uk.gov.homeoffice.drt.routes

import akka.http.scaladsl.server.Directives.{ complete, fileUpload, onSuccess, pathPrefix, post }
import akka.http.scaladsl.server.Route
import akka.http.scaladsl.server.directives.FileInfo
import akka.stream.Materializer
import akka.stream.scaladsl.{ Framing, Source }
import akka.util.ByteString
import org.joda.time.format.DateTimeFormat
import org.joda.time.{ DateTime, DateTimeZone }
import org.slf4j.{ Logger, LoggerFactory }
import uk.gov.homeoffice.drt.Dashboard._
import uk.gov.homeoffice.drt.DrtClient._
import uk.gov.homeoffice.drt.auth.Roles.{ CreateAlerts, NeboUpload }
import uk.gov.homeoffice.drt.routes.ApiRoutes.authByRole
import uk.gov.homeoffice.drt.routes.UploadRoutes.MillisSinceEpoch

import scala.concurrent.{ ExecutionContextExecutor, Future }

case class Row(urnReference: String, associatedText: String, flightCode: String, arrivalPort: String, date: String)

case class FlightData(flightCode: String, portCode: String, scheduled: MillisSinceEpoch, paxCount: Int)

object UploadRoutes {
  type MillisSinceEpoch = Long

  val log: Logger = LoggerFactory.getLogger(getClass)

  val routePath = "/data/feeds/red-list-counts"

  def apply(prefix: String, neboPortCodes: List[String])(implicit ec: ExecutionContextExecutor, mat: Materializer): Route = authByRole(NeboUpload) {
    val route: Route =
      pathPrefix(prefix) {
        post {
          fileUpload("csv") {
            case (metadata, byteSource) =>
              val flightData: Future[List[FlightData]] = processCSV(metadata, byteSource)
              val responseF = neboPortCodes.map { portCode =>
                flightData.flatMap(r => sendData(r.filter(_.flightCode.toLowerCase == portCode.toLowerCase), s"${drtUriForPortCode(portCode)}$routePath"))
              }
              onSuccess(Future.sequence(responseF)) { response =>
                complete(s"Posted to DRT with status ${response.map(_.status)}")
              }
          }
        }
      }
    route
  }

  def processCSV(metadata: FileInfo, byteSource: Source[ByteString, Any])(implicit ec: ExecutionContextExecutor, mat: Materializer) = {
    val rowsF: Future[List[Row]] = byteSource.via(Framing.delimiter(ByteString("\n"), maximumFrameLength = 2048, allowTruncation = true))
      .map(mapToRow)
      .runFold(List.empty[Row]) { (r, n) => r :+ n }

    rowsF.map(rowToJson(_, metadata))
  }

  def mapToRow(byteString: ByteString): Row = {
    val map: Map[Int, String] = byteString.utf8String.split(",")
      .zipWithIndex
      .toMap
      .map { case (k, v) => v -> k }

    Row(map.getOrElse(0, "").trim, map.getOrElse(1, "").trim, map.getOrElse(2, "").trim, map.getOrElse(3, "").trim, map.getOrElse(4, "").trim)
  }

  def rowToJson(rows: List[Row], metadata: FileInfo): List[FlightData] = {
    val dataRows: Seq[Row] = rows.tail.filterNot(_.flightCode.isEmpty)
    log.info(s"Processing ${dataRows.size} rows from the file name `${metadata.fileName}`")
    dataRows.groupBy(_.arrivalPort)
      .flatMap { arrivalPort =>
        arrivalPort._2.groupBy(_.flightCode)
          .map(flightCode => FlightData(arrivalPort._1, flightCode._1, covertDateTime(flightCode._2.head.date), flightCode._2.size))
      }.toList
  }

  val covertDateTime: String => MillisSinceEpoch = date => if (date.isEmpty) 0 else DateTime.parse(date, DateTimeFormat.forPattern("dd/MM/yyyy HH:mm:ss")).withZone(DateTimeZone.UTC).getMillis

}
