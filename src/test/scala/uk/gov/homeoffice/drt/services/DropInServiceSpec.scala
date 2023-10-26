package uk.gov.homeoffice.drt.services

import akka.actor.ActorSystem
import com.typesafe.config.ConfigFactory
import org.joda.time.DateTime
import org.mockito.ArgumentMatchers.any
import org.mockito.Mockito
import org.mockito.Mockito._
import org.specs2.mutable.SpecificationLike
import org.specs2.specification.BeforeEach
import slick.jdbc.PostgresProfile.api._
import uk.gov.homeoffice.drt.authentication.{AccessRequest, ClientUserRequestedAccessData}
import uk.gov.homeoffice.drt.db._
import uk.gov.homeoffice.drt.notifications.EmailNotifications
import uk.gov.service.notify.{NotificationClientApi, SendEmailResponse}

import java.sql.Timestamp
import java.util.UUID
import scala.concurrent.Await
import scala.concurrent.ExecutionContext.Implicits.global
import scala.concurrent.duration.DurationInt

class DropInServiceSpec extends SpecificationLike with BeforeEach {

  sequential

  lazy val db = TestDatabase.db

  implicit val sys: ActorSystem = ActorSystem("testActorSystem", ConfigFactory.empty())

  val teamEmail = "test@test.com"
  val rootDomain = "localhost"

  override protected def before: Any = {
    Await.ready(
      db.run(DBIO.seq(
        TestDatabase.userTable.schema.dropIfExists,
        TestDatabase.userTable.schema.createIfNotExists,
        TestDatabase.userAccessRequestsTable.schema.dropIfExists,
        TestDatabase.userAccessRequestsTable.schema.createIfNotExists,
        TestDatabase.dropInTable.schema.dropIfExists,
        TestDatabase.dropInTable.schema.createIfNotExists,
        TestDatabase.dropInRegistrationTable.schema.dropIfExists,
        TestDatabase.dropInRegistrationTable.schema.createIfNotExists)
      ), 2.second)
  }

  def response(
                notificationId: String = "",
                reference: String = "",
                templateId: String = "templateId",
                templateVersion: String = "2",
                templateUri: String = "uri",
                body: String = "body",
                subject: String = "subject",
                fromEmail: String = "") = {
    s"""{"id":"${UUID.randomUUID()}",
       | "notificationId":"$notificationId",
       | "reference":"$reference",
       | "template":{
       |    "id":"$templateId",
       |    "version":"$templateVersion",
       |    "uri":"$templateUri",
       | },
       | "content":{
       |  "body":"$body",
       |  "subject":"$subject",
       |  "fromEmail":"$fromEmail"
       | },
       |} """.stripMargin
  }

  def getUser = {
    User(id = "test",
      username = "test",
      email = "test@test.com",
      latest_login = new Timestamp(1693609200000L),
      inactive_email_sent = None,
      revoked_access = None,
      drop_in_notification = None)
  }

  def getAccessRequest = {
    AccessRequest(agreeDeclaration = true,
      allPorts = false,
      lineManager = "lineManager",
      portOrRegionText = "port",
      portsRequested = Set("lhr"),
      rccOption = "",
      regionsRequested = Set(),
      staffing = false,
      staffText = "")
  }

  def clientUserRequestedAccessData(accessRequest: AccessRequest, requestTime: String) = {
    ClientUserRequestedAccessData(agreeDeclaration = true,
      allPorts = false,
      email = "test@test.com",
      lineManager = accessRequest.lineManager,
      portOrRegionText = accessRequest.portOrRegionText,
      portsRequested = accessRequest.portsRequested.mkString(","),
      accountType = accessRequest.portOrRegionText,
      regionsRequested = accessRequest.regionsRequested.mkString(","),
      requestTime = requestTime,
      staffText = accessRequest.staffText,
      staffEditing = accessRequest.staffing,
      status = "Requested")
  }

  "DropInService" >> {
    "Send dropIn notification if user is requested access after 1 September" >> {

      val dropInDao = DropInDao(TestDatabase.db)
      val dropInRegistrationDao = DropInRegistrationDao(TestDatabase.db)
      val userService = UserService(UserDao(TestDatabase.db))
      val userRequestService = UserRequestService(UserAccessRequestDao(TestDatabase.db))
      val dropInService: DropInService = new DropInService(dropInDao,
        dropInRegistrationDao,
        userService,
        userRequestService, teamEmail)
      val emailClient = Mockito.mock(classOf[NotificationClientApi])
      when(emailClient.sendEmail(any(), any(), any(), any())).thenReturn(new SendEmailResponse(response(templateId = UUID.randomUUID().toString)))
      val emailNotifications = EmailNotifications(List("test@test.com"), emailClient)

      val accessRequest = getAccessRequest
      userRequestService.updateUserRequest(
        clientUserRequestedAccessData(accessRequest, "2023-09-02 15:10:10.000"),
        "Approved"
      )

      userService.upsertUser(getUser)

      val beforeDropInNotification = Await.result(userService.getUsersWithoutDropInNotification, 1.second)
      beforeDropInNotification.head.drop_in_notification.isDefined === false
      beforeDropInNotification.size === 1

      Await.result(dropInService.sendDropInNotificationToNewUsers(emailNotifications, "localhost"), 1.second)

      Mockito.verify(emailClient, Mockito.times(1)).sendEmail(any, any(), any(), any())

      val afterDropInNotification: Seq[User] = Await.result(userService.getUsers(), 1.second)
      afterDropInNotification.head.drop_in_notification.isDefined === true
      afterDropInNotification.size === 1
    }

    "Don't Send dropIn notification if user is requested access before 1 September" >> {

      val dropInDao = DropInDao(TestDatabase.db)
      val dropInRegistrationDao = DropInRegistrationDao(TestDatabase.db)
      val userService = UserService(UserDao(TestDatabase.db))
      val userRequestService = UserRequestService(UserAccessRequestDao(TestDatabase.db))
      val dropInService: DropInService = new DropInService(dropInDao,
        dropInRegistrationDao,
        userService,
        userRequestService, "test@test.com")
      val emailClient = Mockito.mock(classOf[NotificationClientApi])
      val emailNotifications = EmailNotifications(List("test@test.com"), emailClient)
      when(emailClient.sendEmail(any(), any(), any(), any())).thenReturn(new SendEmailResponse(response(templateId = UUID.randomUUID().toString)))

      val accessRequest = getAccessRequest
      userRequestService.updateUserRequest(
        clientUserRequestedAccessData(accessRequest, "2023-08-30 15:10:10.000"),
        "Approved"
      )


      userService.upsertUser(getUser)

      val beforeDropInNotification = Await.result(userService.getUsersWithoutDropInNotification, 1.second)
      beforeDropInNotification.head.drop_in_notification.isDefined === false
      beforeDropInNotification.size === 1

      Await.result(dropInService.sendDropInNotificationToNewUsers(emailNotifications, rootDomain), 1.second)

      Mockito.verify(emailClient, Mockito.times(0)).sendEmail(any, any(), any(), any())

      val afterDropInNotification: Seq[User] = Await.result(userService.getUsers(), 1.second)
      afterDropInNotification.head.drop_in_notification.isDefined === false
      afterDropInNotification.size === 1
    }

    "Don't Send dropIn notification if user is requested access is not Approved" >> {

      val dropInDao = DropInDao(TestDatabase.db)
      val dropInRegistrationDao = DropInRegistrationDao(TestDatabase.db)
      val userService = UserService(UserDao(TestDatabase.db))
      val userRequestService = UserRequestService(UserAccessRequestDao(TestDatabase.db))
      val dropInService: DropInService = new DropInService(dropInDao,
        dropInRegistrationDao,
        userService,
        userRequestService, teamEmail)
      val emailClient = Mockito.mock(classOf[NotificationClientApi])
      val emailNotifications = EmailNotifications(List("test@test.com"), emailClient)
      when(emailClient.sendEmail(any(), any(), any(), any())).thenReturn(new SendEmailResponse(response(templateId = UUID.randomUUID().toString)))
      val accessRequest = getAccessRequest
      userRequestService.updateUserRequest(
        clientUserRequestedAccessData(accessRequest, "2023-09-02 15:10:10.000"),
        "Requested"
      )

      userService.upsertUser(getUser)

      val beforeDropInNotification = Await.result(userService.getUsersWithoutDropInNotification, 1.second)
      beforeDropInNotification.head.drop_in_notification.isDefined === false
      beforeDropInNotification.size === 1

      Await.result(dropInService.sendDropInNotificationToNewUsers(emailNotifications, rootDomain), 1.second)
      Mockito.verify(emailClient, Mockito.times(0)).sendEmail(any, any(), any(), any())

      val afterDropInNotification: Seq[User] = Await.result(userService.getUsers(), 1.second)
      afterDropInNotification.head.drop_in_notification.isDefined === false
      afterDropInNotification.size === 1
    }

    "Don't Send dropIn notification if user is has being registered for dropIn" >> {

      val dropInDao = DropInDao(TestDatabase.db)
      val dropInRegistrationDao = DropInRegistrationDao(TestDatabase.db)
      val userService = UserService(UserDao(TestDatabase.db))
      val userRequestService = UserRequestService(UserAccessRequestDao(TestDatabase.db))
      val dropInService: DropInService = new DropInService(dropInDao,
        dropInRegistrationDao,
        userService,
        userRequestService, teamEmail)
      val emailClient = Mockito.mock(classOf[NotificationClientApi])
      val emailNotifications = EmailNotifications(List("test@test.com"), emailClient)
      when(emailClient.sendEmail(any(), any(), any(), any())).thenReturn(new SendEmailResponse(response(templateId = UUID.randomUUID().toString)))
      val accessRequest = getAccessRequest
      userRequestService.updateUserRequest(
        clientUserRequestedAccessData(accessRequest, "2023-09-02 15:10:10.000"),
        "Approved"
      )

      userService.upsertUser(getUser)

      dropInDao.insertDropIn("test",
        new Timestamp(DateTime.now().minusSeconds(60).getMillis),
        new Timestamp(DateTime.now().minusSeconds(30).getMillis),
        None)

      dropInRegistrationDao.insertRegistration("test@test.com", 1, new Timestamp(DateTime.now().minusSeconds(30).getMillis), None)
      val beforeDropInNotification = Await.result(userService.getUsersWithoutDropInNotification, 1.second)
      beforeDropInNotification.head.drop_in_notification.isDefined === false
      beforeDropInNotification.size === 1

      Await.result(dropInService.sendDropInNotificationToNewUsers(emailNotifications, rootDomain), 1.second)
      Mockito.verify(emailClient, Mockito.times(0)).sendEmail(any, any(), any(), any())

      val afterDropInNotification: Seq[User] = Await.result(userService.getUsers(), 1.second)
      afterDropInNotification.head.drop_in_notification.isDefined === false
      afterDropInNotification.size === 1
    }

    "Don't Send dropIn notification if user is has being send notification already" >> {

      val dropInDao = DropInDao(TestDatabase.db)
      val dropInRegistrationDao = DropInRegistrationDao(TestDatabase.db)
      val userService = UserService(UserDao(TestDatabase.db))
      val userRequestService = UserRequestService(UserAccessRequestDao(TestDatabase.db))
      val dropInService: DropInService = new DropInService(dropInDao,
        dropInRegistrationDao,
        userService,
        userRequestService, teamEmail)
      val emailClient = Mockito.mock(classOf[NotificationClientApi])
      val emailNotifications = EmailNotifications(List("test@test.com"), emailClient)
      when(emailClient.sendEmail(any(), any(), any(), any())).thenReturn(new SendEmailResponse(response(templateId = UUID.randomUUID().toString)))

      val accessRequest = getAccessRequest
      userRequestService.updateUserRequest(
        clientUserRequestedAccessData(accessRequest, "2023-09-02 15:10:10.000"),
        "Approved"
      )

      userService.upsertUser(getUser)

      val beforeDropInNotification = Await.result(userService.getUsersWithoutDropInNotification, 1.second)
      beforeDropInNotification.head.drop_in_notification.isDefined === false
      beforeDropInNotification.size === 1

      Await.result(dropInService.sendDropInNotificationToNewUsers(emailNotifications, rootDomain), 1.second)

      val afterDropInNotification: Seq[User] = Await.result(userService.getUsers(), 1.second)
      afterDropInNotification.head.drop_in_notification.isDefined === true
      afterDropInNotification.size === 1

      Await.result(dropInService.sendDropInNotificationToNewUsers(emailNotifications, rootDomain), 1.second)
      Mockito.verify(emailClient, Mockito.times(1)).sendEmail(any, any(), any(), any())
      val replayDropInNotification: Seq[User] = Await.result(userService.getUsers(), 1.second)
      replayDropInNotification.head.drop_in_notification.isDefined === true
      replayDropInNotification.size === 1
      replayDropInNotification.head.drop_in_notification === afterDropInNotification.head.drop_in_notification
    }
  }
}
