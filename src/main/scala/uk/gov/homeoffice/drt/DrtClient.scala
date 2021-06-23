package uk.gov.homeoffice.drt

import akka.http.scaladsl.Http
import akka.http.scaladsl.marshallers.sprayjson.SprayJsonSupport
import akka.http.scaladsl.model.{ HttpRequest, _ }
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

trait HttpClient extends JsonSupport {
  val log: Logger = LoggerFactory.getLogger(getClass)

  def send(httpRequest: HttpRequest)(implicit executionContext: ExecutionContextExecutor, mat: Materializer): Future[HttpResponse]

  def createDrtNeboRequest(data: List[FlightData], uri: String) = {
    log.info(s"Sending json to drt for $uri with ${data.size} flight details")
    HttpRequest(
      method = HttpMethods.POST,
      uri = uri,
      headers = rolesToRoleHeader(List(Roles.NeboUpload)),
      entity = HttpEntity(ContentTypes.`application/json`, data.toJson.toString()))
  }
}

class DrtClient extends HttpClient {
  def send(httpRequest: HttpRequest)(implicit executionContext: ExecutionContextExecutor, mat: Materializer): Future[HttpResponse] = {
    Http()(mat.system).singleRequest(httpRequest)
  }

}
