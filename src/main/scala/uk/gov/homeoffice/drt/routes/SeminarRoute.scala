package uk.gov.homeoffice.drt.routes

import akka.http.scaladsl.marshallers.sprayjson.SprayJsonSupport._
import akka.http.scaladsl.model.StatusCodes
import akka.http.scaladsl.server.Directives._
import org.joda.time.DateTime
import org.slf4j.{Logger, LoggerFactory}
import spray.json.{RootJsonFormat, enrichAny}
import uk.gov.homeoffice.drt.db.{SeminarDao, SeminarRow}

import java.sql.Timestamp
import java.time.format.DateTimeFormatter
import java.time.{LocalDateTime, ZoneId, ZoneOffset}
import scala.concurrent.ExecutionContext

case class SeminarPublished(published: Boolean)

case class SeminarData(title: String, startTime: String, endTime: String, meetingLink: String)

trait SeminarJsonFormats extends DefaultTimeJsonProtocol {

  implicit val seminarDataFormatParser: RootJsonFormat[SeminarData] = jsonFormat4(SeminarData)
  implicit val seminarRowFormatParser: RootJsonFormat[SeminarRow] = jsonFormat7(SeminarRow)
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
      entity(as[SeminarData]) { seminar =>
        val updatedSeminarResult = seminarDao.updateSeminar(SeminarRow(Some(seminarId.toInt), seminar.title, stringToTimestamp(seminar.startTime), stringToTimestamp(seminar.endTime), false, Option(seminar.meetingLink), new Timestamp(new DateTime().getMillis)))
        routeResponse(updatedSeminarResult
          .map(_ => complete(StatusCodes.OK, s"Seminar with Id $seminarId is updated successfully")), "Editing Seminar")
      }
    }
  }

  def publishSeminar(seminarDao: SeminarDao)(implicit ec: ExecutionContext) = path("published" / Segment) { (seminarId) =>
    post {
      entity(as[SeminarPublished]) { featurePublished =>
        val publishedSeminarResult = seminarDao.updatePublishSeminar(seminarId, featurePublished.published)
          .map(_ => complete(StatusCodes.OK, s"Seminar $seminarId is published successfully"))

        routeResponse(publishedSeminarResult, "Publishing Seminar")

      }
    }
  }

  def deleteSeminar(seminarDao: SeminarDao)(implicit ec: ExecutionContext) =
    path("delete" / Segment) { seminarId =>
      delete {
        val deletedSeminarResult = seminarDao.deleteSeminar(seminarId)
        routeResponse(deletedSeminarResult.map(_ => complete(StatusCodes.OK, s"Seminar $seminarId is deleted successfully")), "Deleting Seminar")
      }
    }

  def getSeminars(seminarDao: SeminarDao)(implicit ec: ExecutionContext) = path("get" / Segment) { listAll =>
    get {
      val getSeminarsResult =
        if (listAll.toBoolean) seminarDao.getSeminars.map(forms => complete(StatusCodes.OK, forms.toJson))
        else seminarDao.getFutureSeminars.map(forms => complete(StatusCodes.OK, forms.toJson))
      routeResponse(getSeminarsResult, "Getting Seminar")
    }
  }

  def saveSeminar(seminarDao: SeminarDao)(implicit ec: ExecutionContext) = path("save") {
    post {
      entity(as[SeminarData]) { seminar =>
        val saveSeminarResult = seminarDao.insertSeminar(seminar.title, stringToTimestamp(seminar.startTime), stringToTimestamp(seminar.endTime), Option(seminar.meetingLink))
        routeResponse(
          saveSeminarResult.map(_ => complete(StatusCodes.OK, s"Seminar ${seminar.title} is saved successfully")), "Saving Seminar")
      }
    }
  }

  def apply(prefix: String, seminarDao: SeminarDao)(implicit ec: ExecutionContext) = pathPrefix(prefix) {
    concat(saveSeminar(seminarDao) ~ getSeminars(seminarDao) ~ deleteSeminar(seminarDao) ~ publishSeminar(seminarDao) ~ editSeminar(seminarDao))
  }
}
