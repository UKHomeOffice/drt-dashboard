package uk.gov.homeoffice.drt.routes

import akka.actor.testkit.typed.scaladsl.ActorTestKit
import akka.http.scaladsl.model.HttpResponse
import akka.http.scaladsl.model.headers.RawHeader
import akka.http.scaladsl.server.Route
import akka.http.scaladsl.testkit.Specs2RouteTest
import com.typesafe.config.{ Config, ConfigFactory }
import org.specs2.mutable.Specification
import uk.gov.homeoffice.drt.auth.Roles.BorderForceStaff
import uk.gov.homeoffice.drt.db.{ MockUserAccessRequestDao, MockUserDao, User }
import uk.gov.homeoffice.drt.notifications.EmailNotifications
import uk.gov.homeoffice.drt.ports.PortRegion
import uk.gov.homeoffice.drt.services.{ UserRequestService, UserService }
import uk.gov.homeoffice.drt.{ ClientConfig, JsonSupport }

import java.sql.Timestamp
import java.time.Instant

class UserRoutesSpec extends Specification with Specs2RouteTest with JsonSupport {
  val testKit: ActorTestKit = ActorTestKit()
  implicit val sys = testKit.system
  private val config: Config = ConfigFactory.load()
  val stringToLocalDateTime: String => Instant = dateString => Instant.parse(dateString)
  val userService = new UserService(new MockUserDao())
  val userRequestService: UserRequestService = new UserRequestService(new MockUserAccessRequestDao())
  val clientConfig: ClientConfig = ClientConfig(Seq(PortRegion.North), "somedomain.com", "test@test.com")
  val apiKey: String = config.getString("dashboard.notifications.gov-notify-api-key")

  userService.upsertUser(User(
    "poise/test1",
    "poise/test1",
    "test1@test.com",
    new Timestamp(stringToLocalDateTime("2022-12-05T10:15:30.00Z").toEpochMilli),
    None,
    None))

  userService.upsertUser(User(
    "poise/test2",
    "poise/test2",
    "test2@test.com",
    new Timestamp(stringToLocalDateTime("2022-12-05T10:15:30.00Z").toEpochMilli),
    None,
    None))

  val userRoutes: Route = UserRoutes(
    "user",
    clientConfig,
    userService,
    userRequestService,
    EmailNotifications(apiKey, List("access-requests@drt")),
    "")

  "Request data for user should" >> {
    "Give list of all users accessing drt" >> {
      Get("/user/all") ~>
        RawHeader("X-Auth-Roles", BorderForceStaff.name) ~>
        RawHeader("X-Auth-Email", "my@email.com") ~> userRoutes ~> check {
          responseAs[String] shouldEqual
            """[{"email":"test1@test.com","id":"poise/test1","latest_login":"2022-12-05 10:15:30.0","username":"poise/test1"},{"email":"test2@test.com","id":"poise/test2","latest_login":"2022-12-05 10:15:30.0","username":"poise/test2"}]""".stripMargin
        }
    }
  }
}
