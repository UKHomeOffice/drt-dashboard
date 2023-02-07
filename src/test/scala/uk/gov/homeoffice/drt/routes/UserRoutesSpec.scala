package uk.gov.homeoffice.drt.routes

import akka.actor.testkit.typed.scaladsl.ActorTestKit
import akka.actor.typed.ActorSystem
import akka.http.scaladsl.model.headers.RawHeader
import akka.http.scaladsl.server.Route
import akka.http.scaladsl.testkit.Specs2RouteTest
import com.typesafe.config.{ Config, ConfigFactory }
import org.joda.time.DateTime
import org.specs2.mutable.Specification
import org.specs2.specification.{ AfterEach, BeforeEach }
import slick.lifted.TableQuery
import spray.json.{ JsValue, enrichAny }
import uk.gov.homeoffice.drt.auth.Roles.BorderForceStaff
import uk.gov.homeoffice.drt.authentication.{ AccessRequest, AccessRequestJsonSupport }
import uk.gov.homeoffice.drt.db._
import uk.gov.homeoffice.drt.notifications.EmailNotifications
import uk.gov.homeoffice.drt.ports.PortRegion
import uk.gov.homeoffice.drt.services.{ UserRequestService, UserService }
import uk.gov.homeoffice.drt.{ ClientConfig, JsonSupport }

import java.sql.Timestamp
import java.time.Instant
import scala.concurrent.duration.DurationInt
import scala.concurrent.{ Await, ExecutionContext, Future }
import slick.jdbc.PostgresProfile.api._
import spray.json._

class UserRoutesSpec extends Specification with Specs2RouteTest with JsonSupport with AccessRequestJsonSupport with UserAccessRequestJsonSupport with UserJsonSupport with BeforeEach {
  val testKit: ActorTestKit = ActorTestKit()
  implicit val sys: ActorSystem[Nothing] = testKit.system
  private val config: Config = ConfigFactory.load()
  val stringToLocalDateTime: String => Instant = dateString => Instant.parse(dateString)
  val clientConfig: ClientConfig = ClientConfig(Seq(PortRegion.North), "someDomain.com", "test@test.com")
  val apiKey: String = config.getString("dashboard.notifications.gov-notify-api-key")
  var appDatabaseTest: AppTestDatabase = null
  var userTable: TableQuery[UserTable] = null
  val tableName = "user_route_test"

  val user1 = User(
    "poise/test1",
    "poise/test1",
    "test1@test.com",
    new Timestamp(stringToLocalDateTime("2022-12-06T10:15:30.00Z").toEpochMilli),
    None,
    None)

  val user2 = User(
    "poise/test2",
    "poise/test2",
    "test2@test.com",
    new Timestamp(stringToLocalDateTime("2022-12-05T10:15:30.00Z").toEpochMilli),
    None,
    None)

  def insertUser(userService: UserService): Future[Int] = {
    userService.upsertUser(user2)
    userService.upsertUser(user1)
  }

  def userRoutes(userService: UserService, userRequestService: UserRequestService): Route = UserRoutes(
    "user",
    clientConfig,
    userService,
    userRequestService,
    EmailNotifications(List("access-requests@drt"), new MockNotificationClient),
    "")

  val accessRequest: AccessRequest = AccessRequest(
    agreeDeclaration = false,
    allPorts = false,
    "lineManager",
    "lhr",
    Set("lhr"),
    "",
    Set.empty,
    staffing = false,
    "")

  def isAccessRequestMatching(userAccessRequest: UserAccessRequest): Boolean = {
    userAccessRequest.email == "my@email.com" &&
      Set(userAccessRequest.portsRequested) == accessRequest.portsRequested &&
      userAccessRequest.allPorts == accessRequest.allPorts &&
      (Set(userAccessRequest.regionsRequested) == accessRequest.regionsRequested || accessRequest.regionsRequested.isEmpty && userAccessRequest.regionsRequested.isEmpty) &&
      userAccessRequest.staffEditing == accessRequest.staffing &&
      userAccessRequest.lineManager == accessRequest.lineManager &&
      userAccessRequest.agreeDeclaration == accessRequest.agreeDeclaration &&
      userAccessRequest.accountType == accessRequest.rccOption &&
      userAccessRequest.portOrRegionText == accessRequest.portOrRegionText &&
      userAccessRequest.staffText == accessRequest.staffText &&
      userAccessRequest.status == "Requested"
  }

  def expectedUserAccess(accessRequest: AccessRequest, timestamp: Timestamp): UserAccessRequest = {
    UserAccessRequest(
      email = "my@email.com",
      portsRequested = accessRequest.portsRequested.mkString(","),
      allPorts = accessRequest.allPorts,
      regionsRequested = accessRequest.regionsRequested.mkString(","),
      staffEditing = accessRequest.staffing,
      lineManager = accessRequest.lineManager,
      agreeDeclaration = accessRequest.agreeDeclaration,
      accountType = accessRequest.rccOption,
      portOrRegionText = accessRequest.portOrRegionText,
      staffText = accessRequest.staffText,
      status = "Requested",
      requestTime = timestamp)
  }

  "User api" >> {

    "Give list of all users accessing drt" >> {
      val userService = new UserService(new UserDao(appDatabaseTest.db, userTable))
      val userRequestService: UserRequestService = new UserRequestService(new MockUserAccessRequestDao())
      Await.result(insertUser(userService), 5.seconds)
      Get("/user/all") ~>
        RawHeader("X-Auth-Roles", BorderForceStaff.name) ~>
        RawHeader("X-Auth-Email", "my@email.com") ~> userRoutes(userService, userRequestService) ~> check {
          responseAs[String].parseJson === Seq(user2, user1).toJson
        }
    }

    "Saves user access request" >> {
      val userService = new UserService(new UserDao(appDatabaseTest.db, userTable))
      val userRequestService: UserRequestService = new UserRequestService(new MockUserAccessRequestDao())
      Post("/user/access-request", accessRequest.toJson) ~>
        RawHeader("X-Auth-Roles", BorderForceStaff.name) ~>
        RawHeader("X-Auth-Email", "my@email.com") ~> userRoutes(userService, userRequestService) ~> check {
          val usersF: Future[Seq[UserAccessRequest]] = userRequestService.getUserRequest("Requested")
          val users = Await.result(usersF, 1.seconds)
          val userAccessRequest: UserAccessRequest = users.head
          isAccessRequestMatching(userAccessRequest)
          responseAs[String] shouldEqual "OK"
        }
    }

    "Gives user access requested" >> {
      val userService = new UserService(new UserDao(appDatabaseTest.db, userTable))
      val userRequestService: UserRequestService = new UserRequestService(new MockUserAccessRequestDao())
      val accessRequestToSave = accessRequest.copy(lineManager = "LineManager1")
      val currentTime = new Timestamp(DateTime.now().getMillis)
      userRequestService.saveUserRequest("my@email.com", accessRequestToSave, currentTime)
      userRequestService.getUserRequest("Requested").map(println)
      Get("/user/access-request?status=\"Requested\"") ~>
        RawHeader("X-Auth-Roles", BorderForceStaff.name) ~>
        RawHeader("X-Auth-Email", "my@email.com") ~> userRoutes(userService, userRequestService) ~> check {
          responseAs[JsValue] shouldEqual Seq(expectedUserAccess(accessRequestToSave, currentTime)).toJson
        }
    }

  }

  def deleteUserTableData(db: Database, userTable: TableQuery[UserTable])(implicit executionContext: ExecutionContext): Int = {
    Await.result(db.run(userTable.delete), 5.seconds)
  }

  override protected def before: Any = {
    appDatabaseTest = new AppTestDatabase()
    appDatabaseTest.createDbStructure(tableName)
    userTable = appDatabaseTest.userTestTable(tableName)
    deleteUserTableData(appDatabaseTest.db, userTable)
  }
}