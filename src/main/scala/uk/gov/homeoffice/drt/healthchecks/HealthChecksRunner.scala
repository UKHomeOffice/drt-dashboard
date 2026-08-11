package uk.gov.homeoffice.drt.healthchecks

import org.apache.pekko.Done
import org.apache.pekko.http.scaladsl.model.{ HttpRequest, HttpResponse }
import org.apache.pekko.stream.Materializer
import org.apache.pekko.stream.scaladsl.{ Sink, Source }
import org.slf4j.LoggerFactory
import uk.gov.homeoffice.drt.healthchecks.alarms.AlarmState
import uk.gov.homeoffice.drt.ports.PortCode

import scala.concurrent.{ ExecutionContext, Future }

object HealthChecksRunner {
  private val log = LoggerFactory.getLogger(getClass)

  def apply(
      makeRequest: HttpRequest => Future[HttpResponse],
      recordResponse: (PortCode, HealthCheckResponse[_]) => Future[AlarmState],
      healthChecks: Seq[HealthCheck[_]]
  )(implicit mat: Materializer, ec: ExecutionContext): Option[Iterable[PortCode]] => Future[Done] =
    maybePorts => {
      val monitoredPorts = maybePorts.getOrElse(Seq(PortCode("Dashboard")))
      val checks = maybePorts match {
        case Some(ports) if ports.nonEmpty =>
          Source(ports.toList)
            .mapAsync(1) { port =>
              HealthChecker(Option(port), makeRequest, healthChecks).map(_.map(r => (port, r)))
            }
        case _ =>
          Source.future {
            HealthChecker(None, makeRequest, healthChecks).map(_.map(r => (PortCode("Dashboard"), r)))
          }
      }

      checks
        .mapConcat(identity)
        .mapAsync(1) {
          case (port, response) => recordResponse(port, response)
        }
        .runWith(Sink.ignore)
        .recover {
          case t: Throwable =>
            HealthCheckLogging.logMonitorFailure(log, monitoredPorts, RunnerFailure, t)
            Done
        }
    }
}
