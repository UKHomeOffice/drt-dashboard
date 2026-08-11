package uk.gov.homeoffice.drt.healthchecks

import spray.json._
import uk.gov.homeoffice.drt.ports.PortCode
import uk.gov.homeoffice.drt.routes.api.v1.FlightApiV1Routes.FlightJsonResponseV1
import uk.gov.homeoffice.drt.routes.api.v1.QueueApiV1Routes.QueueJsonResponseV1
import uk.gov.homeoffice.drt.routes.api.v1_1.FlightApiV1_1Routes.FlightJsonResponseV1_1
import uk.gov.homeoffice.drt.routes.api.v1_1.QueueApiV1_1Routes.QueueJsonResponseV1_1
import uk.gov.homeoffice.drt.services.api.v1.serialiser.{ FlightApiV1JsonFormats, QueueApiV1JsonFormats }
import uk.gov.homeoffice.drt.services.api.v1_1.serialiser.{ FlightApiV1_1JsonFormats, QueueApiV1_1JsonFormats }
import uk.gov.homeoffice.drt.time.{ SDate, SDateLike }

import scala.concurrent.duration.FiniteDuration
import scala.util.{ Failure, Success, Try }

trait HealthCheck[A] {
  val priority: IncidentPriority
  val name: String
  val checkType: String
  def description: String
  def url: String
  val parseResponse: String => HealthCheckResponse[A]
  def httpHeaders: Map[String, String] = Map.empty
  def thresholdPercentage: Option[Int] = None
  def minimumFlightsValue: Option[Int] = None
  def windowStartForLog: Option[String] = None
  def windowEndForLog: Option[String] = None
  def extraLogFields: Map[String, String] = Map.empty

  def failure: HealthCheckResponse[A]
}

trait JsonHealthCheck[T] extends HealthCheck[Boolean] {
  def serialise: String => T
  override val parseResponse: String => HealthCheckResponse[Boolean] =
    str => {
      val trySerialise = Try(serialise(str)).map(_ => true)
      val isPass = trySerialise.getOrElse(false)
      val failureType = if (trySerialise.isSuccess) None else Option("parse_failure")
      BooleanHealthCheckResponse(priority, name, Success(Option(isPass)), Option(isPass), failureType)
    }

  override def failure: HealthCheckResponse[Boolean] =
    BooleanHealthCheckResponse(
      priority,
      name,
      Failure(new Exception("Failed to parse response")),
      None,
      Option("request_failure")
    )
}

trait PercentageHealthCheck extends HealthCheck[Double] {
  def passThresholdPercentage: Int

  override val parseResponse: String => HealthCheckResponse[Double] =
    str => {
      val value: Try[Option[Double]] = str match {
        case "null" => Try(None)
        case _      => Try(Option(str.toDouble))
      }
      val maybeIsPass = value.toOption.flatten.map(_ >= passThresholdPercentage)
      val failureType = if (value.isFailure) Option("parse_failure") else None

      PercentageHealthCheckResponse(priority, name, value, maybeIsPass, failureType)
    }

  override def failure: HealthCheckResponse[Double] =
    PercentageHealthCheckResponse(
      priority,
      name,
      Failure(new Exception("Failed to parse response")),
      None,
      Option("request_failure")
    )

  override def thresholdPercentage: Option[Int] = Option(passThresholdPercentage)
}

case class QueueApiV1HealthCheck(now: () => SDateLike, portCodes: Iterable[PortCode])
    extends JsonHealthCheck[QueueJsonResponseV1] with QueueApiV1JsonFormats {
  override val priority: IncidentPriority = Priority1
  override val name: String = "Queue API v1"
  override val checkType: String = "queue_api_v1"
  override def description: String = s"Queue API v1 is reachable and responding with valid json"

  private def todayAt(hour: Int): SDateLike = SDate(now().toUtcDate).addHours(hour)
  private val startHour = 13
  private val endHour = 14
  private val start: SDateLike = todayAt(startHour)
  private val end: SDateLike = todayAt(endHour)
  override def url: String = s"/api/v1/queues?start=${start.toISOString}&end=${end.toISOString}"
  override def windowStartForLog: Option[String] = Option(start.toISOString)
  override def windowEndForLog: Option[String] = Option(end.toISOString)

  override def httpHeaders: Map[String, String] = Map(
    "X-Forwarded-Email" -> "health-check",
    "X-Forwarded-Groups" -> (portCodes.map(_.iata).toSeq :+ "api-queue-access").mkString(",")
  )

  override def serialise: String => QueueJsonResponseV1 = _.parseJson.convertTo[QueueJsonResponseV1]
}

case class QueueApiV1_1HealthCheck(now: () => SDateLike, portCodes: Iterable[PortCode])
    extends JsonHealthCheck[QueueJsonResponseV1_1] with QueueApiV1_1JsonFormats {
  override val priority: IncidentPriority = Priority1
  override val name: String = "Queue API v1.1"
  override val checkType: String = "queue_api_v1_1"
  override def description: String = s"Queue API v1.1 is reachable and responding with valid json"

  private def todayAt(hour: Int): SDateLike = SDate(now().toUtcDate).addHours(hour)
  private val startHour = 13
  private val endHour = 14
  private val start: SDateLike = todayAt(startHour)
  private val end: SDateLike = todayAt(endHour)
  override def url: String = s"/api/v1.1/queues?start=${start.toISOString}&end=${end.toISOString}"
  override def windowStartForLog: Option[String] = Option(start.toISOString)
  override def windowEndForLog: Option[String] = Option(end.toISOString)

  override def httpHeaders: Map[String, String] = Map(
    "X-Forwarded-Email" -> "health-check",
    "X-Forwarded-Groups" -> (portCodes.map(_.iata).toSeq :+ "api-queue-access").mkString(",")
  )

  override def serialise: String => QueueJsonResponseV1_1 = _.parseJson.convertTo[QueueJsonResponseV1_1]
}

case class FlightApiV1HealthCheck(now: () => SDateLike, portCodes: Iterable[PortCode])
    extends JsonHealthCheck[FlightJsonResponseV1] with FlightApiV1JsonFormats {
  override val priority: IncidentPriority = Priority1
  override val name: String = "Flight API v1"
  override val checkType: String = "flight_api_v1"
  override def description: String = s"Flight API v1 is reachable and responding with valid json"

  private def todayAt(hour: Int): SDateLike = SDate(now().toUtcDate).addHours(hour)
  private val startHour = 13
  private val endHour = 14
  private val start: SDateLike = todayAt(startHour)
  private val end: SDateLike = todayAt(endHour)
  override def url: String = s"/api/v1/flights?start=${start.toISOString}&end=${end.toISOString}"
  override def windowStartForLog: Option[String] = Option(start.toISOString)
  override def windowEndForLog: Option[String] = Option(end.toISOString)

  override def httpHeaders: Map[String, String] = Map(
    "X-Forwarded-Email" -> "health-check",
    "X-Forwarded-Groups" -> (portCodes.map(_.iata).toSeq :+ "api-flight-access").mkString(",")
  )

  override def serialise: String => FlightJsonResponseV1 = _.parseJson.convertTo[FlightJsonResponseV1]
}

case class FlightApiV1_1HealthCheck(now: () => SDateLike, portCodes: Iterable[PortCode])
    extends JsonHealthCheck[FlightJsonResponseV1_1] with FlightApiV1_1JsonFormats {
  override val priority: IncidentPriority = Priority1
  override val name: String = "Flight API v1.1"
  override val checkType: String = "flight_api_v1_1"
  override def description: String = s"Flight API v1.1 is reachable and responding with valid json"

  private def todayAt(hour: Int): SDateLike = SDate(now().toUtcDate).addHours(hour)
  private val startHour = 13
  private val endHour = 14
  private val start: SDateLike = todayAt(startHour)
  private val end: SDateLike = todayAt(endHour)
  override def url: String = s"/api/v1.1/flights?start=${start.toISOString}&end=${end.toISOString}"
  override def windowStartForLog: Option[String] = Option(start.toISOString)
  override def windowEndForLog: Option[String] = Option(end.toISOString)

  override def httpHeaders: Map[String, String] = Map(
    "X-Forwarded-Email" -> "health-check",
    "X-Forwarded-Groups" -> (portCodes.map(_.iata).toSeq :+ "api-flight-access").mkString(",")
  )

  override def serialise: String => FlightJsonResponseV1_1 = _.parseJson.convertTo[FlightJsonResponseV1_1]
}

case class ApiHealthCheck(
    hoursBeforeNow: Int,
    hoursAfterNow: Int,
    minimumFlights: Int,
    passThresholdPercentage: Int,
    now: () => SDateLike
) extends PercentageHealthCheck {
  private val start = () => now().addHours(-hoursBeforeNow)
  private val end = () => now().addHours(hoursAfterNow)
  override val priority: IncidentPriority = Priority1
  override val name: String = "API received"
  override val checkType: String = "api_received"
  override def description: String =
    s"""$passThresholdPercentage% of flights landing between ${start().prettyDateTime} and ${end().prettyDateTime} which have API data, when we have a minimum of $minimumFlights flights"""
  override def url: String = s"/health-check/received-api/${start().toISOString}/${end().toISOString}/$minimumFlights"
  override def minimumFlightsValue: Option[Int] = Option(this.minimumFlights)
  override def windowStartForLog: Option[String] = Option(start().toISOString)
  override def windowEndForLog: Option[String] = Option(end().toISOString)
}

case class ArrivalLandingTimesHealthCheck(
    windowLength: FiniteDuration,
    buffer: Int,
    minimumFlights: Int,
    passThresholdPercentage: Int,
    now: () => SDateLike
) extends PercentageHealthCheck {
  private val start = () => now().addMinutes(-windowLength.toMinutes.toInt)
  private val end = () => now().addMinutes(-buffer)
  override val priority: IncidentPriority = Priority1
  override val name: String = "Landing Times"
  override val checkType: String = "arrival_landing_times"
  override def description: String =
    s"$passThresholdPercentage% of flights scheduled to land between ${start().toHoursAndMinutes} and ${end().toHoursAndMinutes} which have an actual landing time, when we have a minimum of $minimumFlights flights"
  override def url: String =
    s"/health-check/received-landing-times/${start().toISOString}/${end().toISOString}/$minimumFlights"
  override def minimumFlightsValue: Option[Int] = Option(this.minimumFlights)
  override def windowStartForLog: Option[String] = Option(start().toISOString)
  override def windowEndForLog: Option[String] = Option(end().toISOString)
}

case class ArrivalUpdatesHealthCheck(
    minutesBeforeNow: Int,
    minutesAfterNow: Int,
    updateThreshold: FiniteDuration,
    minimumFlights: Int,
    passThresholdPercentage: Int,
    now: () => SDateLike
) extends PercentageHealthCheck {
  private val start = () => now().addMinutes(-minutesBeforeNow)
  private val end = () => now().addMinutes(minutesAfterNow)
  override val priority: IncidentPriority = Priority2
  override val name: String = s"Arrival Updates"
  override val checkType: String = "arrival_updates"
  override def description: String =
    s"$passThresholdPercentage% of flights expected to land between ${start().toHoursAndMinutes} and ${end().toHoursAndMinutes} that have been updated in the past ${updateThreshold.toMinutes} minutes, when we have a minimum of $minimumFlights flights"
  override def url: String =
    s"/health-check/received-arrival-updates/${start().toISOString}/${end().toISOString}/$minimumFlights/${updateThreshold.toMinutes}"
  override def minimumFlightsValue: Option[Int] = Option(this.minimumFlights)
  override def windowStartForLog: Option[String] = Option(start().toISOString)
  override def windowEndForLog: Option[String] = Option(end().toISOString)
  override def extraLogFields: Map[String, String] = Map("updateThresholdMinutes" -> updateThreshold.toMinutes.toString)
}

trait IncidentPriority {
  val name: String
}

case object Priority1 extends IncidentPriority {
  override val name: String = "P1"
}

case object Priority2 extends IncidentPriority {
  override val name: String = "P2"
}
