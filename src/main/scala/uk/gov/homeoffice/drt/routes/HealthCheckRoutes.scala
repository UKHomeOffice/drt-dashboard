package uk.gov.homeoffice.drt.routes

import org.apache.pekko.http.scaladsl.marshallers.sprayjson.SprayJsonSupport._
import org.apache.pekko.http.scaladsl.model._
import org.apache.pekko.http.scaladsl.server.Directives._
import org.apache.pekko.http.scaladsl.server.Route
import org.slf4j.LoggerFactory
import spray.json.{ enrichAny, DefaultJsonProtocol, JsObject, JsValue, RootJsonFormat }
import uk.gov.homeoffice.drt.auth.Roles.HealthChecksEdit
import uk.gov.homeoffice.drt.healthchecks.{ HealthCheck, HealthCheckLogging, IncidentPriority, ScheduledPause }
import uk.gov.homeoffice.drt.json.HealthCheckAlarmJsonFormats
import uk.gov.homeoffice.drt.json.ScheduledPauseJsonFormats.scheduledPauseJsonFormat
import uk.gov.homeoffice.drt.persistence.ScheduledHealthCheckPausePersistence
import uk.gov.homeoffice.drt.ports.PortCode
import uk.gov.homeoffice.drt.routes.services.AuthByRole
import uk.gov.homeoffice.drt.time.SDate

import scala.concurrent.{ ExecutionContext, ExecutionContextExecutor, Future }
import scala.util.{ Failure, Success }

trait HealthCheckJsonFormats extends DefaultJsonProtocol {
  implicit object IncidentPriorityJsonFormat extends RootJsonFormat[IncidentPriority] {
    override def read(json: JsValue): IncidentPriority = throw new NotImplementedError("Not implemented")

    override def write(obj: IncidentPriority): JsValue = obj.name.toJson
  }

  implicit object HealthCheckJsonFormat extends RootJsonFormat[HealthCheck[_]] {
    override def read(json: JsValue): HealthCheck[_] =
      throw new NotImplementedError("Not implemented")

    override def write(obj: HealthCheck[_]): JsValue =
      JsObject(Map(
        "name" -> obj.name.toJson,
        "description" -> obj.description.toJson,
        "priority" -> obj.priority.toJson
      ))
  }
}

object HealthCheckRoutes extends HealthCheckAlarmJsonFormats with HealthCheckJsonFormats {
  private val log = LoggerFactory.getLogger(getClass)

  def apply(
      getAlarmStatuses: () => Future[Map[PortCode, Map[String, Boolean]]],
      healthChecks: Seq[HealthCheck[_]],
      scheduledPausePersistence: ScheduledHealthCheckPausePersistence
  )(implicit ec: ExecutionContextExecutor): Route = {
    concat(
      pathPrefix("health-checks") {
        concat(
          pathEnd {
            complete(healthChecks)
          },
          path("alarm-statuses") {
            onComplete(getAlarmStatuses()) {
              case Success(alarmStatuses) =>
                complete(alarmStatuses.toJson)
              case _ =>
                complete(StatusCodes.InternalServerError)
            }
          }
        )
      },
      pathPrefix("health-check-pauses") {
        concat(
          post {
            AuthByRole(HealthChecksEdit) {
              headerValueByName("X-Forwarded-Email") { email =>
                entity(as[ScheduledPause]) { scheduledPause =>
                  HealthCheckLogging.logPauseCreated(log, scheduledPause, Option(email))
                  handleFutureOperation(
                    scheduledPausePersistence.insert(scheduledPause),
                    "Failed to save health check pause"
                  )
                }
              }
            }
          },
          get {
            AuthByRole(HealthChecksEdit) {
              complete(scheduledPausePersistence.get(Option(SDate.now().millisSinceEpoch)))
            }
          },
          delete {
            path("health-check-pauses" / Segment / Segment) { (from, to) =>
              val fromMillis = from.toLong
              val toMillis = to.toLong
              AuthByRole(HealthChecksEdit) {
                headerValueByName("X-Forwarded-Email") { email =>
                  HealthCheckLogging.logPauseDeleted(log, fromMillis, toMillis, Option(email))
                  handleFutureOperation(
                    scheduledPausePersistence.delete(fromMillis, toMillis),
                    "Failed to delete health check pause"
                  )
                }
              }
            }
          }
        )
      }
    )
  }

  private def handleFutureOperation(eventual: Future[_], errorMsg: String)(implicit ec: ExecutionContext): Route =
    onComplete(eventual) {
      case Success(_) => complete(Future(StatusCodes.OK))
      case Failure(t) =>
        log.error(errorMsg, t)
        complete(StatusCodes.InternalServerError)
    }

}
