package uk.gov.homeoffice.drt.routes

import akka.http.scaladsl.marshallers.sprayjson.SprayJsonSupport._
import akka.http.scaladsl.model.headers.ContentDispositionTypes.attachment
import akka.http.scaladsl.model.headers.`Content-Disposition`
import akka.http.scaladsl.model.{ContentTypes, HttpEntity, HttpResponse, StatusCodes}
import akka.http.scaladsl.server.Directives._
import akka.stream.scaladsl.Source
import akka.util.ByteString
import spray.json.{RootJsonFormat, enrichAny}
import uk.gov.homeoffice.drt.db.{UserFeedbackDao, UserFeedbackRow}
import uk.gov.homeoffice.drt.json.DefaultTimeJsonProtocol

import java.sql.Timestamp
import java.time.Instant
import scala.concurrent.ExecutionContext

case class FeedbackData(feedbackType: String, aORbTest: String, question_1: String, question_2: String, question_3: String, question_4: String, question_5: String)

trait FeedbackJsonFormats extends DefaultTimeJsonProtocol {

  implicit val feedbackDataFormatParser: RootJsonFormat[FeedbackData] = jsonFormat7(FeedbackData)
  implicit val userFeedbackRowFormatParser: RootJsonFormat[UserFeedbackRow] = jsonFormat11(UserFeedbackRow)
}

object FeedbackRoutes extends FeedbackJsonFormats with BaseRoute {

  def exportFeedback(feedbackDao: UserFeedbackDao)(implicit ec:ExecutionContext) = path("export") {
    get {
      val csvHeader: String = "Email,ActionedAt,FeedbackAt,CloseBanner,FeedbackType,BfRole,DrtQuality,DrtLikes,DrtImprovements,ParticipationInterest,AOrBTest"

      val fetchDataStream = feedbackDao.selectAllAsStream()

      def toCsvString(feedback: UserFeedbackRow) = s"${feedback.email},${feedback.actionedAt.getTime},${feedback.feedbackAt.map(_.getTime)},${feedback.closeBanner},${feedback.feedbackType},${feedback.bfRole},${feedback.drtQuality},${feedback.drtLikes},${feedback.drtImprovements},${feedback.participationInterest},${feedback.aOrBTest}"

      val csvDataStream: Source[ByteString, _] = Source.single(ByteString(csvHeader + "\n"))
        .concat(
          fetchDataStream.map(toCsvString).map(str => ByteString(str + "\n"))
        )


      complete(HttpResponse(
        headers = List(`Content-Disposition`(attachment, Map("filename" -> s"feedback-export-${Instant.now().toEpochMilli}.csv"))),
        entity = HttpEntity(ContentTypes.`text/csv(UTF-8)`, csvDataStream)))

    }
  }

  def getFeedbacks(feedbackDao: UserFeedbackDao)(implicit ec: ExecutionContext) = path("all") {
    get {
      val getFeedbacksResult =
        feedbackDao.selectAll().map(forms => complete(StatusCodes.OK, forms.toJson))
      routeResponse(getFeedbacksResult, "Getting feedbacks")
    }
  }

  def saveFeedback(feedbackDao: UserFeedbackDao)(implicit ec: ExecutionContext) = path("save") {
    headerValueByName("X-Auth-Email") { userEmail =>
      post {
        entity(as[FeedbackData]) { feedbackData =>
          val currentTimestamp = new Timestamp(Instant.now().toEpochMilli)
          val saveFeedbackResult = feedbackDao.insertOrUpdate(
            UserFeedbackRow(
              email = userEmail,
              actionedAt = currentTimestamp,
              feedbackAt = Option(currentTimestamp),
              closeBanner = false,
              feedbackType = Option(feedbackData.feedbackType),
              bfRole = feedbackData.question_1,
              drtQuality = feedbackData.question_2,
              drtLikes = Option(feedbackData.question_3),
              drtImprovements = Option(feedbackData.question_4),
              participationInterest = feedbackData.question_5.equals("Yes"),
              aOrBTest = Option(feedbackData.aORbTest)
            ))
          routeResponse(
            saveFeedbackResult.map(_ => complete(StatusCodes.OK, s"Feedback from user $userEmail is saved successfully")), "Saving feedback")
        }
      }
    }
  }


  def apply(feedbackDao: UserFeedbackDao)(implicit ec: ExecutionContext) =
    pathPrefix("api" / "feedback") {
      concat(saveFeedback(feedbackDao) ~ getFeedbacks(feedbackDao) ~ exportFeedback(feedbackDao))
    }


}
