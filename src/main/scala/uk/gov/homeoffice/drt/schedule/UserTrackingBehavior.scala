package uk.gov.homeoffice.drt.schedule

import akka.actor.ActorSystem
import akka.actor.typed.Behavior
import akka.actor.typed.scaladsl.{Behaviors, TimerScheduler}
import org.slf4j.{Logger, LoggerFactory}
import uk.gov.homeoffice.drt.ServerConfig
import uk.gov.homeoffice.drt.keycloak.KeycloakService
import uk.gov.homeoffice.drt.notifications.EmailNotifications
import uk.gov.homeoffice.drt.services.UserService

import java.sql.Timestamp
import java.util.Date
import scala.concurrent.ExecutionContext
import scala.concurrent.duration.{DurationInt, FiniteDuration}

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
    Behaviors.withTimers(timers => new UserTracking(serverConfig, notifications, timers, after, maxSize).userBehaviour)
  }
}

class UserTracking(
                    serverConfig: ServerConfig,
                    notifications: EmailNotifications,
                    timers: TimerScheduler[UserTracking.Command],
                    after: FiniteDuration,
                    maxSize: Int) {
  val logger: Logger = LoggerFactory.getLogger(getClass)

  import UserTracking._

  timers.startTimerWithFixedDelay(UserTrackingKey, InactiveUserCheck, 1.minutes, after)
  timers.startTimerWithFixedDelay(UserTrackingRevokeKey, RevokeUserCheck, 1.minutes, after)

  private def userBehaviour()(implicit ec: ExecutionContext, system: ActorSystem): Behavior[Command] = {

    Behaviors.receiveMessage[Command] {
      case InactiveUserCheck =>
        val users = UserService.inactiveUserCheck()
        users.map(
          _.map { user =>
            notifications.sendUserEmailNotification(
              user.email,
              serverConfig.rootDomain,
              serverConfig.teamEmail,
              notifications.inactiveUserNotificationTemplateId,
              "inactive user notification")
            UserService.upsertUser(user.copy(inactive_email_sent = Some(new Timestamp(new Date().getTime))))
            logger.info(s"User notify for inactivity ${user.email}")
          })
        Behaviors.same

      case RevokeUserCheck =>
        val usersToRevoke = UserService.getUserToRevoke().map(_.take(maxSize))
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
                  UserService.upsertUser(utr.copy(revoked_access = Some(new Timestamp(new Date().getTime))))
                  logger.info(s"User revoked for inactivity ${utr.email}")
                }
              }
            }
          }
        }
        Behaviors.same
    }
  }
}

