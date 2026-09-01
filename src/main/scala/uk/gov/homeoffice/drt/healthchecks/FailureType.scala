package uk.gov.homeoffice.drt.healthchecks

sealed trait FailureType {
  def logValue: String
}

case object ParseFailure extends FailureType {
  override val logValue: String = "parse_failure"
}

case object RequestFailure extends FailureType {
  override val logValue: String = "request_failure"
}

case object ExceptionFailure extends FailureType {
  override val logValue: String = "exception"
}

case object SchedulerRunFailure extends FailureType {
  override val logValue: String = "scheduler_run_failure"
}

case object RunnerFailure extends FailureType {
  override val logValue: String = "runner_failure"
}

final case class HttpStatusFailure(statusCode: Int) extends FailureType {
  override def logValue: String = s"http_$statusCode"
}
