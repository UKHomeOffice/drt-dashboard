package uk.gov.homeoffice.drt.routes

import akka.http.scaladsl.model.{Multipart, StatusCodes}
import akka.http.scaladsl.server.Directives._
import org.joda.time.DateTime
import org.slf4j.{Logger, LoggerFactory}
import spray.json.{RootJsonFormat, enrichAny}
import uk.gov.homeoffice.drt.db.{SeminarDao, SeminarRow}
import akka.http.scaladsl.marshallers.sprayjson.SprayJsonSupport._
import java.sql.Timestamp
import java.time.{LocalDateTime, ZoneId, ZoneOffset}
import java.time.format.DateTimeFormatter
import scala.concurrent.ExecutionContext

case class SeminarPublished(published: Boolean)

trait SeminarJsonFormats extends DefaultTimeJsonProtocol {

  implicit val seminarRowFormatParser: RootJsonFormat[SeminarRow] = jsonFormat8(SeminarRow)
  implicit val seminarPublishedFormatParser: RootJsonFormat[SeminarPublished] = jsonFormat1(SeminarPublished)

}

object SeminarRoute extends BaseRoute with SeminarJsonFormats {
  override val log: Logger = LoggerFactory.getLogger(getClass)

  val stringToTimestamp: String => Timestamp = timeString => {
    val localTime = LocalDateTime.parse(timeString, DateTimeFormatter.ofPattern("yyyy-MM-dd'T'HH:mm:ssXXX"))
      .atZone(ZoneId.of("Europe/London"))

    val utcTime = localTime.withZoneSameInstant(ZoneOffset.UTC)

    new Timestamp(utcTime.toInstant.toEpochMilli)
  }

  def editSeminar(seminarDao: SeminarDao)(implicit ec: ExecutionContext) = path("edit" / Segment) { seminarId =>
    put {
      entity(as[Multipart.FormData]) { _ =>
        formFields(Symbol("title"), Symbol("description"), Symbol("startTime"), Symbol("endTime"), Symbol("meetingLink")) {
          (title, description, startTime, endTime, meetingLink) =>
            routeResponse(seminarDao.updateSeminar(SeminarRow(Some(seminarId.toInt), title, description, stringToTimestamp(startTime), stringToTimestamp(endTime), false, Option(meetingLink), new Timestamp(new DateTime().getMillis)))
              .map(_ => complete(StatusCodes.OK, s"Seminar with Id $seminarId is updated successfully")), "Updating Seminar Form")
        }
      }
    }
  }

  def publishSeminar(seminarDao: SeminarDao)(implicit ec: ExecutionContext) = path("published" / Segment) { (seminarId) =>
    post {
      entity(as[SeminarPublished]) { featurePublished =>
        val responseF = seminarDao.updatePublishSeminar(seminarId, featurePublished.published)
          .map(_ => complete(StatusCodes.OK, s"Seminar $seminarId is published successfully"))

        routeResponse(responseF, "Publishing Seminar")

      }
    }
  }

  def deleteSeminar(seminarDao: SeminarDao)(implicit ec: ExecutionContext) =
    path("delete" / Segment) { seminarId =>
      delete {
        routeResponse(seminarDao.deleteSeminar(seminarId).map(_ => complete(StatusCodes.OK, s"Seminar $seminarId is deleted successfully")), "Deleting Seminar")
      }
    }

  def getSeminars(seminarDao: SeminarDao)(implicit ec: ExecutionContext) = path("get" / Segment) { listAll =>
    get {
      routeResponse(seminarDao.getSeminars(listAll.toBoolean).map(forms => complete(StatusCodes.OK, forms.toJson)), "Getting Seminar Forms")
    }
  }

  def saveForm(seminarDao: SeminarDao)(implicit ec: ExecutionContext) = path("save") {
    post {
      entity(as[Multipart.FormData]) { _ =>
        formFields(Symbol("title"), Symbol("description"), Symbol("startTime"), Symbol("endTime"), Symbol("meetingLink")) {
          (title, description, startTime, endTime, meetingLink) =>
            routeResponse(seminarDao.insertSeminarForm(title, description, stringToTimestamp(startTime), stringToTimestamp(endTime), Option(meetingLink))
              .map(_ => complete(StatusCodes.OK, s"Seminar $title is saved successfully")), "Saving Seminar Form")
        }
      }
    }
  }

  def apply(prefix: String, seminarDao: SeminarDao)(implicit ec: ExecutionContext) = pathPrefix(prefix) {
    concat(saveForm(seminarDao) ~ getSeminars(seminarDao) ~ deleteSeminar(seminarDao) ~ publishSeminar(seminarDao) ~ editSeminar(seminarDao))
  }
}
