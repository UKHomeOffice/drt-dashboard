package uk.gov.homeoffice.drt.routes

import akka.actor.testkit.typed.scaladsl.ActorTestKit
import akka.actor.typed.ActorSystem
import akka.http.scaladsl.marshallers.sprayjson.SprayJsonSupport
import akka.http.scaladsl.model.headers.{RawHeader, `Content-Disposition`}
import akka.http.scaladsl.model.{ContentTypes, StatusCodes}
import akka.http.scaladsl.server.Route
import akka.http.scaladsl.testkit.Specs2RouteTest
import akka.stream.Materializer
import org.scalatest.matchers.should.Matchers.convertToAnyShouldWrapper
import org.specs2.mutable.Specification
import org.specs2.specification.BeforeEach
import slick.dbio.DBIO
import slick.jdbc.PostgresProfile.api._
import spray.json._
import uk.gov.homeoffice.drt.auth.Roles.BorderForceStaff
import uk.gov.homeoffice.drt.db.{TestDatabase, UserFeedbackDao, UserFeedbackRow, UserFeedbackTable}

import java.sql.Timestamp
import java.time.Instant
import scala.concurrent.duration.DurationInt
import scala.concurrent.{Await, Future}

class FeedbackRoutesSpec extends Specification
  with Specs2RouteTest
  with FeedbackJsonFormats
  with SprayJsonSupport
  with DefaultJsonProtocol
  with BeforeEach {

  val testKit: ActorTestKit = ActorTestKit()
  implicit val sys: ActorSystem[Nothing] = testKit.system
  implicit val mat = Materializer(sys.classicSystem)
  val stringToLocalDateTime: String => Instant = dateString => Instant.parse(dateString)

  override def before = {

    Await.result(TestDatabase.db.run(DBIO.seq(TestDatabase.userFeedbackTable.schema.dropIfExists,
      TestDatabase.userFeedbackTable.schema.createIfNotExists)), 5.second)
  }

  def deleteUserTableData(db: Database, userTable: TableQuery[UserFeedbackTable]): Int = {
    Await.result(db.run(userTable.delete), 5.seconds)
  }

  def getUserFeedBackRow(email: String, feedbackData: FeedbackData, createdAt: Timestamp): UserFeedbackRow = {
    UserFeedbackRow(email = email,
      createdAt = createdAt,
      closeBanner = false,
      bfRole = feedbackData.question_1,
      drtQuality = feedbackData.question_2,
      drtLikes = Option(feedbackData.question_3),
      drtImprovements = Option(feedbackData.question_4),
      participationInterest = feedbackData.question_5.toBoolean,
      feedbackType = Option(feedbackData.feedbackType),
      abVersion = Option(feedbackData.aORbTest))
  }

  def insertUserFeedback(userFeedbackRow: UserFeedbackRow, userFeedbackDao: UserFeedbackDao): Future[Int] = {
    userFeedbackDao.insertOrUpdate(userFeedbackRow)
  }

  def userFeedbackRoute(userFeedbackDao: UserFeedbackDao): Route = FeedbackRoutes(userFeedbackDao)

  "get list of user feedbacks" >> {
    val userFeedbackDao: UserFeedbackDao = UserFeedbackDao(TestDatabase.db)
    val feedbackData = FeedbackData(feedbackType = "banner",
      aORbTest = "A",
      question_1 = "test",
      question_2 = "Good",
      question_3 = "Arrivals",
      question_4 = "Staffing",
      question_5 = "true")
    val userFeedbackRow = getUserFeedBackRow("test@test.com", feedbackData,
      new Timestamp(stringToLocalDateTime("2022-12-06T10:15:30.00Z").toEpochMilli))

    Await.result(insertUserFeedback(userFeedbackRow, userFeedbackDao), 5.seconds)
    Get("/feedback") ~>
      RawHeader("X-Auth-Roles", BorderForceStaff.name) ~>
      RawHeader("X-Auth-Email", "my@email.com") ~> userFeedbackRoute(userFeedbackDao) ~> check {
      val jsonUsers = responseAs[String].parseJson.asInstanceOf[JsArray].elements
      jsonUsers.contains(userFeedbackRow.toJson)
    }
  }

  "save user feedback Data" >> {
    val userFeedbackDao: UserFeedbackDao = UserFeedbackDao(TestDatabase.db)
    val feedbackData = FeedbackData(feedbackType = "banner",
      aORbTest = "A",
      question_1 = "test",
      question_2 = "Good",
      question_3 = "Arrivals",
      question_4 = "Staffing",
      question_5 = "true")
    val email = "my@email.com"

    Post("/feedback", feedbackData.toJson) ~>
      RawHeader("X-Auth-Roles", BorderForceStaff.name) ~>
      RawHeader("X-Auth-Email", email) ~> userFeedbackRoute(userFeedbackDao) ~> check {
      val response = responseAs[String]
      userFeedbackDao.selectAll().map { userFeedback =>
        userFeedback.size === 2 && response.contains(s"Feedback from user $email is saved successfully")
      }
    }
  }

  "export user feedback Data" >> {
    val userFeedbackDao: UserFeedbackDao = UserFeedbackDao(TestDatabase.db)
    val feedbackData = FeedbackData(feedbackType = "banner",
      aORbTest = "A",
      question_1 = "test",
      question_2 = "Good",
      question_3 = "Arrivals",
      question_4 = "Staffing",
      question_5 = "true")
    val email = "test1@email.com"

    val userFeedbackRow = getUserFeedBackRow(email, feedbackData,
      new Timestamp(stringToLocalDateTime("2022-12-06T10:15:30.00Z").toEpochMilli))

    Await.result(insertUserFeedback(userFeedbackRow, userFeedbackDao), 5.seconds)

    val row = Await.result(userFeedbackDao.selectAll(), 5.seconds)

    row.size === 1
    //There is issue here that we are not able to get the row from response but only header
    Get("/feedback/export") ~>
      RawHeader("X-Auth-Roles", BorderForceStaff.name) ~>
      RawHeader("X-Auth-Email", email) ~> userFeedbackRoute(userFeedbackDao) ~>
      check {
        status shouldBe StatusCodes.OK
        header[`Content-Disposition`] should not be None

        val responseEntity = Await.result(response.entity.toStrict(3.seconds), 3.seconds)
        responseEntity.contentType shouldBe ContentTypes.`text/csv(UTF-8)`

        val csvContent = responseEntity.data.utf8String

        csvContent.contains(
          """Email ,CreatedAt ,CloseBanner ,FeedbackType ,BfRole ,DrtQuality ,DrtLikes ,DrtImprovements ,ParticipationInterest ,ABVersion""".stripMargin)
      }
  }

}
