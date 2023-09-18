package uk.gov.homeoffice.drt.schedule

import akka.actor.typed.Behavior
import akka.actor.typed.scaladsl.{ActorContext, Behaviors, TimerScheduler}
import org.slf4j.{Logger, LoggerFactory}
import uk.gov.homeoffice.drt.ServerConfig
import uk.gov.homeoffice.drt.db.{ProdDatabase, SeminarDao, SeminarRegisterDao}
import uk.gov.homeoffice.drt.notifications.EmailNotifications
import uk.gov.homeoffice.drt.services.SeminarService
import scala.concurrent.{ExecutionContext, ExecutionContextExecutor}
import scala.concurrent.duration.{DurationInt, FiniteDuration}

sealed trait SeminarCommand

object SeminarReminder {
  private case object UserSeminarNotifyKey extends SeminarCommand

  private case object SeminarUserNotificationCheck extends SeminarCommand

  def apply(serverConfig: ServerConfig, timerInitialDelay: FiniteDuration, maxSize: Int, notifications: EmailNotifications): Behavior[SeminarCommand] =
    Behaviors.setup { context: ActorContext[SeminarCommand] =>
      implicit val ec: ExecutionContextExecutor = context.executionContext
      val seminarService: SeminarService = new SeminarService(SeminarDao(ProdDatabase.db), SeminarRegisterDao(ProdDatabase.db), serverConfig)

      Behaviors.withTimers(timers => new SeminarReminder(
        notifications,
        seminarService,
        timers,
        timerInitialDelay,
        serverConfig.seminarRemindersCheckFrequency.minutes,
        context).seminarReminderNotification)
    }
}

class SeminarReminder(notifications: EmailNotifications,
                      seminarService: SeminarService,
                      timers: TimerScheduler[SeminarCommand],
                      timerInitialDelay: FiniteDuration,
                      timerInterval: FiniteDuration,
                      context: ActorContext[SeminarCommand]) {
  private val logger: Logger = LoggerFactory.getLogger(getClass)

  import SeminarReminder._

  logger.info(s"Starting timer scheduler for Seminar reminder $timerInterval")
  timers.startTimerWithFixedDelay(UserSeminarNotifyKey, SeminarUserNotificationCheck, timerInitialDelay, timerInterval)

  private def seminarReminderNotification()(implicit ec: ExecutionContext): Behavior[SeminarCommand] = {
    Behaviors.receiveMessage[SeminarCommand] {
      case SeminarUserNotificationCheck =>
        context.log.info("SeminarUserNotificationCheck")
        seminarService.sendSeminarReminders(notifications)
        Behaviors.same

      case unknown =>
        logger.info(s"Unknown command: $unknown")
        Behaviors.same
    }
  }
}



