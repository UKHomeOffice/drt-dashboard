package uk.gov.homeoffice.drt.healthchecks

import org.slf4j.Logger
import uk.gov.homeoffice.drt.ports.PortCode

object HealthCheckLogging {
  val EventCategory: String = "healthcheck"
  val ServiceName: String = "drt-dashboard"

  val ExecutionStartedEvent: String = "DRT_HEALTHCHECK_EXECUTION_STARTED"
  val ResultEvent: String = "DRT_HEALTHCHECK_RESULT"
  val RequestFailedEvent: String = "DRT_HEALTHCHECK_REQUEST_FAILED"
  val AlarmTriggeredEvent: String = "DRT_HEALTHCHECK_ALARM_TRIGGERED"
  val AlarmResolvedEvent: String = "DRT_HEALTHCHECK_ALARM_RESOLVED"
  val MonitorPausedEvent: String = "DRT_HEALTHCHECK_MONITOR_PAUSED"
  val MonitorResumedEvent: String = "DRT_HEALTHCHECK_MONITOR_RESUMED"
  val PauseCreatedEvent: String = "DRT_HEALTHCHECK_PAUSE_CREATED"
  val PauseDeletedEvent: String = "DRT_HEALTHCHECK_PAUSE_DELETED"
  val MonitorFailureEvent: String = "DRT_HEALTHCHECK_MONITOR_FAILURE"

  private def baseFields(check: HealthCheck[_], maybePort: Option[PortCode], requestUri: String): Map[String, String] =
    Map(
      "eventCategory" -> EventCategory,
      "service" -> ServiceName,
      "portCode" -> maybePort.map(_.iata).getOrElse("Dashboard"),
      "checkName" -> check.name,
      "checkType" -> check.checkType,
      "priority" -> check.priority.name,
      "requestUri" -> requestUri
    ) ++
      check.thresholdPercentage.map(v => "thresholdPercentage" -> v.toString) ++
      check.minimumFlightsValue.map(v => "minimumFlights" -> v.toString) ++
      check.windowStartForLog.map(v => "windowStart" -> v) ++
      check.windowEndForLog.map(v => "windowEnd" -> v) ++
      check.extraLogFields

  private def toMessage(eventType: String, fields: Map[String, String]): String = {
    val sorted = (Map("eventType" -> eventType) ++ fields).toSeq.sortBy(_._1)
    sorted.map { case (key, value) => s"$key=$value" }.mkString(s"[$eventType] ", " ", "")
  }

  private def monitorFields(monitoredPorts: Iterable[PortCode]): Map[String, String] =
    Map(
      "eventCategory" -> EventCategory,
      "service" -> ServiceName,
      "portsAffected" -> monitoredPorts.map(_.iata).toSeq.sorted.mkString(",")
    )

  private def pauseFields(pause: ScheduledPause, createdBy: Option[String]): Map[String, String] =
    Map(
      "eventCategory" -> EventCategory,
      "service" -> ServiceName,
      "startsAt" -> pause.startsAt.toString,
      "endsAt" -> pause.endsAt.toString,
      "portsAffected" -> pause.ports.map(_.iata).toSeq.sorted.mkString(",")
    ) ++ createdBy.map(v => "createdBy" -> v)

  def logExecutionStarted(
      logger: Logger,
      check: HealthCheck[_],
      maybePort: Option[PortCode],
      requestUri: String
  ): Unit =
    logger.info(toMessage(ExecutionStartedEvent, baseFields(check, maybePort, requestUri)))

  def logResult(
      logger: Logger,
      check: HealthCheck[_],
      response: HealthCheckResponse[_],
      maybePort: Option[PortCode],
      requestUri: String
  ): Unit = {
    val fields = baseFields(check, maybePort, requestUri) ++
      Map(
        "result" -> response.resultType,
        "isPass" -> response.maybeIsPass.map(_.toString).getOrElse("unknown")
      ) ++
      response.measuredValue.map(v => "measuredValue" -> v) ++
      response.failureType.map(v => "failureType" -> v)

    val message = toMessage(ResultEvent, fields)

    response.maybeIsPass match {
      case Some(false) => logger.warn(message)
      case _           => logger.info(message)
    }
  }

  def logRequestFailed(
      logger: Logger,
      check: HealthCheck[_],
      maybePort: Option[PortCode],
      requestUri: String,
      durationMs: Long,
      failureType: String,
      exception: Throwable
  ): Unit = {
    val fields = baseFields(check, maybePort, requestUri) ++ Map(
      "failureType" -> failureType,
      "durationMs" -> durationMs.toString,
      "exceptionClass" -> exception.getClass.getSimpleName,
      "exceptionMessage" -> Option(exception.getMessage).getOrElse("")
    )

    logger.warn(toMessage(RequestFailedEvent, fields))
  }

  def logAlarmTriggered(
      logger: Logger,
      portCode: PortCode,
      checkName: String,
      priority: IncidentPriority,
      slackNotificationAttempted: Boolean
  ): Unit = {
    val fields = Map(
      "eventCategory" -> EventCategory,
      "service" -> ServiceName,
      "portCode" -> portCode.iata,
      "checkName" -> checkName,
      "priority" -> priority.name,
      "alarmState" -> "active",
      "slackNotificationAttempted" -> slackNotificationAttempted.toString
    )

    logger.warn(toMessage(AlarmTriggeredEvent, fields))
  }

  def logAlarmResolved(
      logger: Logger,
      portCode: PortCode,
      checkName: String,
      priority: IncidentPriority,
      slackNotificationAttempted: Boolean
  ): Unit = {
    val fields = Map(
      "eventCategory" -> EventCategory,
      "service" -> ServiceName,
      "portCode" -> portCode.iata,
      "checkName" -> checkName,
      "priority" -> priority.name,
      "alarmState" -> "inactive",
      "slackNotificationAttempted" -> slackNotificationAttempted.toString
    )

    logger.info(toMessage(AlarmResolvedEvent, fields))
  }

  def logMonitorPaused(logger: Logger, pauses: Seq[ScheduledPause], monitoredPorts: Iterable[PortCode]): Unit = {
    val activePauseCount = pauses.length.toString
    val fields = monitorFields(monitoredPorts) ++ Map(
      "activePauseCount" -> activePauseCount,
      "effectiveScope" -> "global"
    ) ++
      pauses.map(_.startsAt.getMillis).sorted.headOption.map(v => "pauseWindowStart" -> v.toString) ++
      pauses.map(_.endsAt.getMillis).sorted.lastOption.map(v => "pauseWindowEnd" -> v.toString)

    logger.info(toMessage(MonitorPausedEvent, fields))
  }

  def logMonitorResumed(logger: Logger, monitoredPorts: Iterable[PortCode]): Unit =
    logger.info(toMessage(MonitorResumedEvent, monitorFields(monitoredPorts)))

  def logPauseCreated(logger: Logger, pause: ScheduledPause, createdBy: Option[String]): Unit =
    logger.info(toMessage(PauseCreatedEvent, pauseFields(pause, createdBy)))

  def logPauseDeleted(logger: Logger, startsAtMillis: Long, endsAtMillis: Long, createdBy: Option[String]): Unit = {
    val fields = Map(
      "eventCategory" -> EventCategory,
      "service" -> ServiceName,
      "startsAt" -> startsAtMillis.toString,
      "endsAt" -> endsAtMillis.toString
    ) ++ createdBy.map(v => "createdBy" -> v)

    logger.info(toMessage(PauseDeletedEvent, fields))
  }

  def logMonitorFailure(
      logger: Logger,
      monitoredPorts: Iterable[PortCode],
      failureType: String,
      exception: Throwable
  ): Unit = {
    val fields = monitorFields(monitoredPorts) ++ Map(
      "failureType" -> failureType,
      "exceptionClass" -> exception.getClass.getSimpleName,
      "exceptionMessage" -> Option(exception.getMessage).getOrElse("")
    )

    logger.error(toMessage(MonitorFailureEvent, fields))
  }
}
