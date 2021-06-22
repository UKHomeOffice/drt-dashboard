package uk.gov.homeoffice.drt

import akka.http.scaladsl.Http
import akka.http.scaladsl.marshallers.sprayjson.SprayJsonSupport
import akka.http.scaladsl.model._
import akka.stream.Materializer
import org.slf4j.{ Logger, LoggerFactory }
import spray.json.{ DefaultJsonProtocol, _ }
import uk.gov.homeoffice.drt.auth.Roles
import uk.gov.homeoffice.drt.routes.FlightData

import scala.concurrent.{ ExecutionContextExecutor, Future }
import DashboardClient._
trait JsonSupport extends SprayJsonSupport with DefaultJsonProtocol {
  implicit val flightDataFormat = jsonFormat4(FlightData)
}

object DrtClient extends JsonSupport {
  val log: Logger = LoggerFactory.getLogger(getClass)

  def sendData(data: List[FlightData], uri: String)(implicit executionContext: ExecutionContextExecutor, mat: Materializer): Future[HttpResponse] = {
    log.info(s"Sending json to drt for $uri with ${data.size} flight details")
    Http()(mat.system).singleRequest(HttpRequest(
      method = HttpMethods.POST,
      uri = uri,
      headers = rolesToRoleHeader(List(Roles.NeboUpload)),
      entity = HttpEntity(ContentTypes.`application/json`, data.toJson.toString())))
  }

}
