package uk.gov.homeoffice.drt.schedule

import akka.actor.typed.scaladsl.{ ActorContext, Behaviors, TimerScheduler }
import akka.actor.typed.{ ActorRef, Behavior }
import org.slf4j.{ Logger, LoggerFactory }
import uk.gov.homeoffice.drt.ServerConfig
import uk.gov.homeoffice.drt.db.{ AppDatabase, UserDao }
import uk.gov.homeoffice.drt.keycloak.KeyCloakAuthTokenService.GetToken
import uk.gov.homeoffice.drt.keycloak.{ KeyCloakAuthToken, KeyCloakAuthTokenService, KeycloakService }
import uk.gov.homeoffice.drt.notifications.EmailNotifications
import uk.gov.homeoffice.drt.services.UserService

import java.sql.Timestamp
import java.util.Date
import scala.concurrent.ExecutionContext

sealed trait Command

import scala.concurrent.duration.{ DurationInt, FiniteDuration }

object UserTracking {
  private case object UserTrackingKey extends Command

  private case object UserTrackingRevokeKey extends Command

  private case object InactiveUserCheck extends Command

  private case object RevokeUserCheck extends Command

  case class KeyCloakToken(token: KeyCloakAuthToken) extends Command

  def apply(serverConfig: ServerConfig, timerInitialDelay: FiniteDuration, maxSize: Int, notifications: EmailNotifications): Behavior[Command] = Behaviors.setup { context: ActorContext[Command] =>
    implicit val ec = context.executionContext
    val userService: UserService = new UserService(new UserDao(AppDatabase.db, AppDatabase.userTable))

    Behaviors.withTimers(timers => new UserTracking(
      serverConfig,
      notifications,
      userService,
      timers, timerInitialDelay,
      serverConfig.scheduleFrequency.minutes,
      serverConfig.inactivityDays,
      maxSize, context).userBehaviour)
  }
}

class UserTracking(
  serverConfig: ServerConfig,
  notifications: EmailNotifications,
  userService: UserService,
  timers: TimerScheduler[Command],
  timerInitialDelay: FiniteDuration,
  timerInterval: FiniteDuration,
  numberOfInactivityDays: Int,
  maxSize: Int,
  context: ActorContext[Command]) {
  val logger: Logger = LoggerFactory.getLogger(getClass)

  import UserTracking._

  logger.info(s"Starting timer scheduler for user tracking $timerInterval")
  timers.startTimerWithFixedDelay(UserTrackingKey, InactiveUserCheck, timerInitialDelay, timerInterval)
  timers.startTimerWithFixedDelay(UserTrackingRevokeKey, RevokeUserCheck, timerInitialDelay, timerInterval)
  val keyCloakAuthTokenService: Behavior[KeyCloakAuthTokenService.Token] = KeyCloakAuthTokenService.getTokenBehavior(serverConfig.keyClockConfig, serverConfig.keyclockUsername, serverConfig.keyclockPassword)
  val keycloakServiceBehavior: ActorRef[KeyCloakAuthTokenService.Token] = context.spawn(keyCloakAuthTokenService, "keycloakServiceActor")

  private def userBehaviour()(implicit ec: ExecutionContext): Behavior[Command] = {
    Behaviors.receiveMessage[Command] {
      case InactiveUserCheck =>
        context.log.info("InactiveUserCheck")
        val users = userService.getInactiveUsers(numberOfInactivityDays)
        users.map(
          _.map { user =>
            notifications.sendUserInactivityEmailNotification(
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
        keycloakServiceBehavior ! GetToken(context.self)
        Behaviors.same

      case KeyCloakToken(token: KeyCloakAuthToken) =>
        implicit val actorSystem = context.system
        val usersToRevoke = userService.getUsersToRevoke().map(_.take(maxSize))
        val keyClockClient = KeyCloakAuthTokenService.getKeyClockClient(serverConfig.keyClockConfig.url, token)
        val keycloakService = new KeycloakService(keyClockClient)
        usersToRevoke.map { utrOption =>
          utrOption.map { utr =>
            keycloakService.getUsersForEmail(utr.email).map { ud =>
              ud.map { uId =>
                if (utr.email.toLowerCase.trim == uId.email.toLowerCase.trim) {
                  keycloakService.removeUser(uId.id)
                  notifications.sendUserInactivityEmailNotification(
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

