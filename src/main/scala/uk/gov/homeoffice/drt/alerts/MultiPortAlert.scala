package uk.gov.homeoffice.drt.alerts

import akka.actor.typed.ActorSystem
import akka.http.scaladsl.marshallers.sprayjson.SprayJsonSupport
import akka.http.scaladsl.model.HttpResponse
import org.joda.time.{ DateTime, DateTimeZone }
import spray.json.{ DefaultJsonProtocol, RootJsonFormat, enrichAny }
import uk.gov.homeoffice.drt.authentication.User
import uk.gov.homeoffice.drt.{ Dashboard, DashboardClient }
import uk.gov.homeoffice.drt.routes.ApiRoutes.log

import scala.collection.immutable
import scala.concurrent.Future

case class MultiPortAlert(
  title: String,
  message: String,
  alertClass: String,
  expires: String,
  alertPorts: Map[String, Boolean]) {

  def alertForPorts(allPorts: List[String]): Map[String, Alert] = allPorts
    .collect {
      case pc if alertPorts.getOrElse(pc.toUpperCase, false) =>
        pc -> Alert(title, message, alertClass, Dates.localDateStringToMillis(expires))
    }.toMap
}

object Dates {
  def localDateStringToMillis(dateString: String): Long = new DateTime(
    dateString,
    DateTimeZone.forID("Europe/London")).getMillis
}

case class Alert(title: String, message: String, alertClass: String, expires: Long)

object MultiPortAlertJsonSupport extends SprayJsonSupport with DefaultJsonProtocol {
  implicit val MultiPortAlertFormatParser: RootJsonFormat[MultiPortAlert] = jsonFormat5(MultiPortAlert)
  implicit val AlertFormatParser: RootJsonFormat[Alert] = jsonFormat4(Alert)
}

object MultiPortAlertClient {

  def saveAlertsForPorts(portCodes: Array[String], multiPortAlert: MultiPortAlert, user: User)(implicit system: ActorSystem[Nothing]): immutable.Iterable[Future[HttpResponse]] = {
    multiPortAlert.alertForPorts(portCodes.toList).map {
      case (portCode, alert) =>
        import uk.gov.homeoffice.drt.alerts.MultiPortAlertJsonSupport._
        log.info("Sending new alert to ${Dashboard.drtUriForPortCode(portCode)}/alerts")
        DashboardClient.postWithRoles(
          s"${Dashboard.drtUriForPortCode(portCode)}/alerts",
          alert.toJson.toString(),
          user.roles)
    }
  }

}
