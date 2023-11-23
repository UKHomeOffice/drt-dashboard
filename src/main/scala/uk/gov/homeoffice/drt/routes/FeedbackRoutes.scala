package uk.gov.homeoffice.drt.routes

import akka.http.scaladsl.marshallers.sprayjson.SprayJsonSupport._
import akka.http.scaladsl.model.StatusCodes
import akka.http.scaladsl.server.Directives._
import spray.json.{RootJsonFormat, enrichAny}
import uk.gov.homeoffice.drt.db.{UserFeedbackDao, UserFeedbackRow}
import uk.gov.homeoffice.drt.json.DefaultTimeJsonProtocol

import java.sql.Timestamp
import java.time.Instant
import scala.concurrent.ExecutionContext

case class FeedbackData(question_1: String, question_2: String, question_3: String, question_4: String, question_5: String)

trait FeedbackJsonFormats extends DefaultTimeJsonProtocol {

  implicit val feedbackDataFormatParser: RootJsonFormat[FeedbackData] = jsonFormat5(FeedbackData)
  implicit val userFeedbackRowFormatParser: RootJsonFormat[UserFeedbackRow] = jsonFormat9(UserFeedbackRow)
}

object FeedbackRoutes extends FeedbackJsonFormats with BaseRoute {

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
              bfRole = feedbackData.question_1,
              drtQuality = feedbackData.question_2,
              drtLikes = feedbackData.question_3,
              drtImprovements = feedbackData.question_4,
              participationInterest = feedbackData.question_5.equals("Yes")))
          routeResponse(
            saveFeedbackResult.map(_ => complete(StatusCodes.OK, s"Feedback from user $userEmail is saved successfully")), "Saving feedback")
        }
      }
    }
  }

  def apply(prefix: String, feedbackDao: UserFeedbackDao)(implicit ec: ExecutionContext) = pathPrefix(prefix) {
    concat(saveFeedback(feedbackDao) ~ getFeedbacks(feedbackDao))
  }


}
