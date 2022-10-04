package uk.gov.homeoffice.drt.authentication

import akka.http.scaladsl.marshallers.sprayjson.SprayJsonSupport
import org.joda.time.DateTime
import spray.json.{ DefaultJsonProtocol, JsString, JsValue, JsonFormat, RootJsonFormat, deserializationError }

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
  status: String)

