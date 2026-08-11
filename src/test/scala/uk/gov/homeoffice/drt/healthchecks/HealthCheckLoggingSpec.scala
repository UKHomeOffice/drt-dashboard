package uk.gov.homeoffice.drt.healthchecks

import ch.qos.logback.classic.spi.ILoggingEvent
import ch.qos.logback.classic.{ Level, Logger, LoggerContext }
import ch.qos.logback.core.read.ListAppender
import org.joda.time.DateTime
import org.scalatest.matchers.should.Matchers
import org.scalatest.wordspec.AnyWordSpec
import org.slf4j.LoggerFactory
import uk.gov.homeoffice.drt.ports.PortCode
import uk.gov.homeoffice.drt.time.SDate

class HealthCheckLoggingSpec extends AnyWordSpec with Matchers {
  private def listAppenderFor(loggerName: String): (Logger, ListAppender[ILoggingEvent]) = {
    val loggerContext = LoggerFactory.getILoggerFactory.asInstanceOf[LoggerContext]
    val logger = loggerContext.getLogger(loggerName)
    val appender = new ListAppender[ILoggingEvent]()
    appender.setContext(loggerContext)
    appender.start()
    logger.addAppender(appender)
    logger.setAdditive(false)
    logger.setLevel(Level.TRACE)
    (logger, appender)
  }

  "HealthCheckLogging" should {
    val now = () => SDate("2026-06-01T12:00")
    val portCode = PortCode("LHR")

    "log WARN result events for threshold breaches" in {
      val (logger, appender) = listAppenderFor("HealthCheckLoggingSpec.result.warn")
      val check = ApiHealthCheck(2, 1, 4, 50, now)
      val response =
        PercentageHealthCheckResponse(Priority1, "API received", scala.util.Success(Some(42.0)), Some(false))

      HealthCheckLogging.logResult(logger, check, response, Some(portCode), "http://lhr:9000/health-check/received-api")

      val event = appender.list.get(0)
      event.getLevel should ===(Level.WARN)
      event.getFormattedMessage should include("[DRT_HEALTHCHECK_RESULT]")
      event.getFormattedMessage should include("eventType=DRT_HEALTHCHECK_RESULT")
      event.getFormattedMessage should include("portCode=LHR")
      event.getFormattedMessage should include("checkType=api_received")
      event.getFormattedMessage should include("result=threshold_breach")
      event.getFormattedMessage should include("isPass=false")
      logger.detachAppender(appender)
    }

    "log WARN request failed events with failure metadata" in {
      val (logger, appender) = listAppenderFor("HealthCheckLoggingSpec.request.warn")
      val check = ArrivalLandingTimesHealthCheck(scala.concurrent.duration.DurationInt(2).hours, 20, 3, 50, now)

      HealthCheckLogging.logRequestFailed(
        logger,
        check,
        Some(portCode),
        "http://lhr:9000/health-check/received-landing-times",
        850,
        ParseFailure,
        new RuntimeException("Bad response body")
      )

      val event = appender.list.get(0)
      event.getLevel should ===(Level.WARN)
      event.getFormattedMessage should include("[DRT_HEALTHCHECK_REQUEST_FAILED]")
      event.getFormattedMessage should include("failureType=parse_failure")
      event.getFormattedMessage should include("exceptionClass=RuntimeException")
      event.getFormattedMessage should include("durationMs=850")
      logger.detachAppender(appender)
    }

    "log WARN alarm triggered and INFO alarm resolved events" in {
      val (logger, appender) = listAppenderFor("HealthCheckLoggingSpec.alarm")

      HealthCheckLogging.logAlarmTriggered(
        logger,
        portCode,
        "Landing Times",
        Priority1,
        slackNotificationAttempted = true
      )
      HealthCheckLogging.logAlarmResolved(
        logger,
        portCode,
        "Landing Times",
        Priority1,
        slackNotificationAttempted = true
      )

      appender.list.get(0).getLevel should ===(Level.WARN)
      appender.list.get(0).getFormattedMessage should include("[DRT_HEALTHCHECK_ALARM_TRIGGERED]")
      appender.list.get(0).getFormattedMessage should include("alarmState=active")
      appender.list.get(1).getLevel should ===(Level.INFO)
      appender.list.get(1).getFormattedMessage should include("[DRT_HEALTHCHECK_ALARM_RESOLVED]")
      appender.list.get(1).getFormattedMessage should include("alarmState=inactive")
      logger.detachAppender(appender)
    }

    "log INFO execution started events with check metadata" in {
      val (logger, appender) = listAppenderFor("HealthCheckLoggingSpec.execution")
      val check = ApiHealthCheck(2, 1, 4, 50, now)

      HealthCheckLogging.logExecutionStarted(
        logger,
        check,
        Some(portCode),
        "http://lhr:9000/health-check/received-api"
      )

      val event = appender.list.get(0)
      event.getLevel should ===(Level.INFO)
      event.getFormattedMessage should include("[DRT_HEALTHCHECK_EXECUTION_STARTED]")
      event.getFormattedMessage should include("checkType=api_received")
      event.getFormattedMessage should include("minimumFlights=4")
      event.getFormattedMessage should include("thresholdPercentage=50")
      logger.detachAppender(appender)
    }

    "log INFO monitor paused and resumed events" in {
      val (logger, appender) = listAppenderFor("HealthCheckLoggingSpec.monitor.lifecycle")
      val pause = ScheduledPause(
        DateTime.parse("2026-06-01T10:00:00Z"),
        DateTime.parse("2026-06-01T12:00:00Z"),
        Seq(portCode),
        DateTime.parse("2026-06-01T09:00:00Z")
      )

      HealthCheckLogging.logMonitorPaused(logger, Seq(pause), Seq(portCode))
      HealthCheckLogging.logMonitorResumed(logger, Seq(portCode))

      appender.list.get(0).getLevel should ===(Level.INFO)
      appender.list.get(0).getFormattedMessage should include("[DRT_HEALTHCHECK_MONITOR_PAUSED]")
      appender.list.get(0).getFormattedMessage should include("effectiveScope=global")
      appender.list.get(0).getFormattedMessage should include("activePauseCount=1")
      appender.list.get(1).getLevel should ===(Level.INFO)
      appender.list.get(1).getFormattedMessage should include("[DRT_HEALTHCHECK_MONITOR_RESUMED]")
      logger.detachAppender(appender)
    }

    "log INFO pause created/deleted and ERROR monitor failure events" in {
      val (logger, appender) = listAppenderFor("HealthCheckLoggingSpec.pause.and.failure")
      val pause = ScheduledPause(
        DateTime.parse("2026-06-01T10:00:00Z"),
        DateTime.parse("2026-06-01T12:00:00Z"),
        Seq(portCode),
        DateTime.parse("2026-06-01T09:00:00Z")
      )

      HealthCheckLogging.logPauseCreated(logger, pause, Option("ops@example.com"))
      HealthCheckLogging.logPauseDeleted(
        logger,
        pause.startsAt.getMillis,
        pause.endsAt.getMillis,
        Option("ops@example.com")
      )
      HealthCheckLogging.logMonitorFailure(
        logger,
        Seq(portCode),
        SchedulerRunFailure,
        new RuntimeException("pause lookup failed")
      )

      appender.list.get(0).getLevel should ===(Level.INFO)
      appender.list.get(0).getFormattedMessage should include("[DRT_HEALTHCHECK_PAUSE_CREATED]")
      appender.list.get(0).getFormattedMessage should include("portsAffected=LHR")
      appender.list.get(0).getFormattedMessage should include("createdBy=ops@example.com")
      appender.list.get(1).getLevel should ===(Level.INFO)
      appender.list.get(1).getFormattedMessage should include("[DRT_HEALTHCHECK_PAUSE_DELETED]")
      appender.list.get(1).getFormattedMessage should include("createdBy=ops@example.com")
      appender.list.get(2).getLevel should ===(Level.ERROR)
      appender.list.get(2).getFormattedMessage should include("[DRT_HEALTHCHECK_MONITOR_FAILURE]")
      appender.list.get(2).getFormattedMessage should include("failureType=scheduler_run_failure")
      logger.detachAppender(appender)
    }
  }
}
