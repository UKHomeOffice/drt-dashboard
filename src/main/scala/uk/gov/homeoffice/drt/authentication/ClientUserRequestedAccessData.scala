package uk.gov.homeoffice.drt.authentication

import akka.http.scaladsl.marshallers.sprayjson.SprayJsonSupport
import org.joda.time.DateTime
import org.joda.time.format.DateTimeFormat
import spray.json.{ DefaultJsonProtocol, JsString, JsValue, JsonFormat, RootJsonFormat, deserializationError }
import uk.gov.homeoffice.drt.db.UserAccessRequest

import java.sql.Timestamp

trait ClientUserAccessDataJsonSupport extends SprayJsonSupport with DefaultJsonProtocol {
  implicit object ClientDateTimeFormat extends JsonFormat[Timestamp] {
    override def write(obj: Timestamp): JsValue = JsString(obj.toString)

    override def read(json: JsValue): Timestamp = json match {
      case JsString(rawDate) => {
        try {
          DateTime.parse(rawDate)
        } catch {
          case iae: IllegalArgumentException => deserializationError("Invalid date format")
          case _: Exception => None
        }
      } match {
        case dateTime: Timestamp => dateTime
        case None => deserializationError(s"Couldn't parse date time, got $rawDate")
      }
    }
  }

  implicit val clientUserAccessDataJsonSupportDataFormatParser: RootJsonFormat[ClientUserRequestedAccessData] = jsonFormat12(ClientUserRequestedAccessData)

}

case class ClientUserRequestedAccessData(
  agreeDeclaration: Boolean,
  allPorts: Boolean,
  email: String,
  lineManager: String,
  portOrRegionText: String,
  portsRequested: String,
  rccOption: Boolean,
  regionsRequested: String,
  requestTime: String,
  staffText: String,
  staffing: Boolean,
  status: String) {
  def getListOfPortOrRegion = {
    if (rccOption && regionsRequested.nonEmpty) {
      regionsRequested.split(",").toList.map("RCC%20" + _)
    } else if (portsRequested.nonEmpty) {
      portsRequested.split(",").toList
    } else {
      List.empty
    }
  }

  def convertUserAccessRequest: UserAccessRequest = {
    UserAccessRequest(
      email = email,
      portsRequested = portsRequested,
      allPorts = allPorts,
      regionsRequested = regionsRequested,
      staffing = staffing,
      lineManager = lineManager,
      agreeDeclaration = agreeDeclaration,
      rccOption = rccOption,
      portOrRegionText = portOrRegionText,
      staffText = staffText,
      status = status,
      requestTime = new Timestamp(DateTime.parse(requestTime, DateTimeFormat.forPattern("YYYY-MM-dd HH:mm:ss.SSS")).getMillis))
  }
}

