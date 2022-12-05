package uk.gov.homeoffice.drt.schedule

import akka.actor.ActorSystem
import akka.actor.typed.Behavior
import akka.actor.typed.scaladsl.{ Behaviors, TimerScheduler }
import org.slf4j.{ Logger, LoggerFactory }
import uk.gov.homeoffice.drt.ServerConfig
import uk.gov.homeoffice.drt.db.{ AppDatabase, UserDao }
import uk.gov.homeoffice.drt.keycloak.KeycloakService
import uk.gov.homeoffice.drt.notifications.EmailNotifications
import uk.gov.homeoffice.drt.services.UserService

import java.sql.Timestamp
import java.util.Date
import scala.concurrent.ExecutionContext
import scala.concurrent.duration.{ DurationInt, FiniteDuration }

object UserTracking {

  sealed trait Command

  private case object UserTrackingKey extends Command

  private case object UserTrackingRevokeKey extends Command

  private case object InactiveUserCheck extends Command

  private case object RevokeUserCheck extends Command

  def apply(serverConfig: ServerConfig, after: FiniteDuration, maxSize: Int): Behavior[Command] = Behaviors.setup { context =>
    implicit val ec = context.executionContext
    implicit val actorSystem = context.system.classicSystem
    val notifications: EmailNotifications = EmailNotifications(serverConfig.notifyServiceApiKey, serverConfig.accessRequestEmails)
    val userService = new UserService(new UserDao(AppDatabase.db, AppDatabase.userTable))
    Behaviors.withTimers(timers => new UserTracking(
      serverConfig,
      notifications,
      userService,
      timers, after,
      serverConfig.scheduleFrequency,
      serverConfig.inactivityDays,
      serverConfig.userTrackingFeatureFlag,
      maxSize).userBehaviour)
  }
}

class UserTracking(
  serverConfig: ServerConfig,
  notifications: EmailNotifications,
  userService: UserService,
  timers: TimerScheduler[UserTracking.Command],
  after: FiniteDuration,
  frequency: Int,
  numberOfInactivityDays: Int,
  userTrackingFeatureFlag: Boolean,
  maxSize: Int) {
  val logger: Logger = LoggerFactory.getLogger(getClass)

  import UserTracking._

  if (userTrackingFeatureFlag) {
    logger.info(s"Starting timer scheduler for user tracking")
    timers.startTimerWithFixedDelay(UserTrackingKey, InactiveUserCheck, frequency.minutes, after)
    timers.startTimerWithFixedDelay(UserTrackingRevokeKey, RevokeUserCheck, frequency.minutes, after)
  }

  private def userBehaviour()(implicit ec: ExecutionContext, system: ActorSystem): Behavior[Command] = {

    Behaviors.receiveMessage[Command] {
      case InactiveUserCheck =>
        val users = userService.inactiveUserCheck(numberOfInactivityDays)
        users.map(
          _.map { user =>
            notifications.sendUserEmailNotification(
              user.email,
              serverConfig.rootDomain,
              serverConfig.teamEmail,
              notifications.inactiveUserNotificationTemplateId,
              "inactive user notification")
            userService.upsertUser(user.copy(inactive_email_sent = Some(new Timestamp(new Date().getTime))))
            logger.info(s"User with email ${user.email} notified due to inactivity")
          })
        Behaviors.same

      case RevokeUserCheck =>
        val usersToRevoke = userService.getUserToRevoke().map(_.take(maxSize))
        val keyCloakAuthToken = KeycloakService.getManageUserToken(serverConfig.keyClockConfig, serverConfig.keyclockUsername, serverConfig.keyclockPassword)
        val keyClockClient = KeycloakService.getKeyClockClient(serverConfig.keyClockConfig.url, keyCloakAuthToken)
        val keycloakService = new KeycloakService(keyClockClient)
        usersToRevoke.map { utrOption =>
          utrOption.map { utr =>
            keycloakService.getUsersForEmail(utr.email).map { ud =>
              ud.map { uId =>
                if (utr.email.toLowerCase.trim == uId.email.toLowerCase.trim) {
                  keycloakService.removeUser(uId.id)
                  notifications.sendUserEmailNotification(
                    uId.email,
                    serverConfig.rootDomain,
                    serverConfig.teamEmail,
                    notifications.revokeAccessTemplateId,
                    "revoked DRT Access")
                  userService.upsertUser(utr.copy(revoked_access = Some(new Timestamp(new Date().getTime))))
                  logger.info(s"User with email ${utr.email} access revoked due to inactivity")
                }
              }
            }
          }
        }
        Behaviors.same
      case _ =>
        logger.info(s"Unknown command to log")
        Behaviors.same

    }
  }
}

