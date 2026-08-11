package uk.gov.homeoffice.drt.healthchecks

import scala.util.Try

trait HealthCheckResponse[A] {
  val priority: IncidentPriority
  val name: String
  val value: Try[Option[A]]
  val maybeIsPass: Option[Boolean]
  val failureType: Option[FailureType]

  def measuredValue: Option[String] = value.toOption.flatten.map(_.toString)

  def resultType: String = failureType.map(_.logValue).getOrElse(
    maybeIsPass match {
      case Some(true)              => "success"
      case Some(false)             => "threshold_breach"
      case None if value.isSuccess => "no_data"
      case None                    => "unknown"
    }
  )
}

case class PercentageHealthCheckResponse(
    priority: IncidentPriority,
    name: String,
    value: Try[Option[Double]],
    maybeIsPass: Option[Boolean],
    failureType: Option[FailureType] = None
) extends HealthCheckResponse[Double]

case class BooleanHealthCheckResponse(
    priority: IncidentPriority,
    name: String,
    value: Try[Option[Boolean]],
    maybeIsPass: Option[Boolean],
    failureType: Option[FailureType] = None
) extends HealthCheckResponse[Boolean]
