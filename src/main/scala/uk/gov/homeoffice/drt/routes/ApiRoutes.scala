package uk.gov.homeoffice.drt.routes

import akka.actor.typed.ActorSystem
import akka.http.scaladsl.model.StatusCodes.InternalServerError
import akka.http.scaladsl.model.{ ContentTypes, HttpEntity, StatusCodes }
import akka.http.scaladsl.server.Directives.{ complete, pathPrefix, _ }
import akka.http.scaladsl.server.directives.MethodDirectives.get
import akka.http.scaladsl.server.{ Directive0, Route }
import akka.http.scaladsl.unmarshalling.Unmarshal
import org.slf4j.{ Logger, LoggerFactory }
import spray.json._
import uk.gov.homeoffice.drt.alerts.{ Alert, MultiPortAlert, MultiPortAlertClient, MultiPortAlertJsonSupport }
import uk.gov.homeoffice.drt.auth.Roles
import uk.gov.homeoffice.drt.auth.Roles._
import uk.gov.homeoffice.drt.authentication.{ AccessRequest, AccessRequestJsonSupport, ClientUserAccessDataJsonSupport, ClientUserRequestedAccessData, KeyCloakUser, KeyCloakUserJsonSupport, User, UserJsonSupport }
import uk.gov.homeoffice.drt.notifications.EmailNotifications
import uk.gov.homeoffice.drt.ports.PortRegion
import uk.gov.homeoffice.drt.redlist.{ RedListJsonFormats, RedListUpdate, RedListUpdates, SetRedListUpdate }
import uk.gov.homeoffice.drt._
import uk.gov.homeoffice.drt.db.UserAccessRequestJsonSupport
import uk.gov.homeoffice.drt.services.UserRequestService

import scala.compat.java8.OptionConverters._
import scala.concurrent.{ ExecutionContextExecutor, Future }
import scala.util.{ Failure, Success }

case class PortAlerts(portCode: String, alerts: List[Alert])

object ApiRoutes extends JsonSupport
  with MultiPortAlertJsonSupport
  with RedListJsonFormats
  with AccessRequestJsonSupport
  with UserJsonSupport
  with ClientConfigJsonFormats
  with UserAccessRequestJsonSupport
  with KeyCloakUserJsonSupport
  with ClientUserAccessDataJsonSupport {

  val log: Logger = LoggerFactory.getLogger(getClass)

  def authByRole(role: Role): Directive0 = authorize(ctx => {
    (for {
      rolesHeader <- ctx.request.getHeader("X-Auth-Roles").asScala
      emailHeader <- ctx.request.getHeader("X-Auth-Email").asScala
    } yield User.fromRoles(emailHeader.value(), rolesHeader.value())) match {
      case Some(user) => user.hasRole(role)
      case None => false
    }
  })

  def apply(
    prefix: String,
    clientConfig: ClientConfig,
    notifications: EmailNotifications,
    neboUploadRoute: Route)(implicit ec: ExecutionContextExecutor, system: ActorSystem[Nothing]): Route =
    pathPrefix(prefix) {
      concat(
        (get & path("user")) {
          headerValueByName("X-Auth-Roles") { rolesStr =>
            headerValueByName("X-Auth-Email") { email =>
              complete(User.fromRoles(email, rolesStr))
            }
          }
        },
        (get & path("config")) {
          headerValueByName("X-Auth-Roles") { _ =>
            complete(clientConfig)
          }
        },
        (post & path("request-access")) {
          headerValueByName("X-Auth-Email") { userEmail =>
            entity(as[AccessRequest]) { accessRequest =>
              UserRequestService.saveUserRequest(userEmail, accessRequest)
              val failures = notifications.sendRequest(userEmail, accessRequest).foldLeft(List[(String, Throwable)]()) {
                case (exceptions, (_, Success(_))) => exceptions
                case (exceptions, (requestAddress, Failure(newException))) => (requestAddress, newException) :: exceptions
              }

              if (failures.nonEmpty) {
                failures.foreach {
                  case (failedEmail, exception) =>
                    log.error(s"Failed to send access request email to $failedEmail", exception)
                }
                complete(StatusCodes.InternalServerError)
              } else complete(StatusCodes.OK)
            }
          }
        },
        (get & path("request-access")) {
          parameters("status") { status =>
            headerValueByName("X-Auth-Roles") { _ =>
              onComplete(UserRequestService.getUserRequest(status)) {
                case Success(value) =>
                  complete(value.toJson)
                case Failure(ex) => complete(InternalServerError, s"An error occurred: ${ex.getMessage}")
              }
            }
          }
        },
        (post & path("red-list-updates")) {
          authByRole(RedListsEdit) {
            entity(as[SetRedListUpdate]) {
              setRedListUpdate =>
                Roles.portRoles.map { portRole =>
                  DashboardClient.postWithRoles(
                    s"${Dashboard.drtUriForPortCode(portRole.name)}/red-list/updates",
                    setRedListUpdate.toJson.compactPrint,
                    Seq(RedListsEdit, portRole))
                }
                complete(Future(StatusCodes.OK))
            }
          }
        },
        (get & path("red-list-updates")) {
          authByRole(RedListsEdit) {
            val requestPortRole = LHR
            val uri = s"${Dashboard.drtUriForPortCode(requestPortRole.name)}/red-list/updates"
            val futureRedListUpdates: Future[RedListUpdates] =
              DashboardClient
                .getWithRoles(uri, Seq(RedListsEdit, requestPortRole))
                .flatMap { res =>
                  Unmarshal[HttpEntity](res.entity.withContentType(ContentTypes.`application/json`))
                    .to[List[RedListUpdate]]
                    .map(r => RedListUpdates(r.map(ru => (ru.effectiveFrom, ru)).toMap))
                    .recover {
                      case e: Throwable =>
                        log.error(s"Failed to retrieve red list updates for ${requestPortRole.name} at $uri", e)
                        RedListUpdates.empty
                    }
                }
            complete(futureRedListUpdates)
          }
        },
        (delete & path("red-list-updates" / Segment)) { dateMillisToDelete =>
          authByRole(RedListsEdit) {
            Roles.portRoles.map { portRole =>
              val uri = s"${Dashboard.drtUriForPortCode(portRole.name)}/red-list/updates/$dateMillisToDelete"
              DashboardClient.deleteWithRoles(uri, Seq(RedListsEdit, portRole))
            }
            complete(Future(StatusCodes.OK))
          }
        },
        (post & path("alerts")) {
          authByRole(CreateAlerts) {
            headerValueByName("X-Auth-Roles") { rolesStr =>
              headerValueByName("X-Auth-Email") { email =>
                entity(as[MultiPortAlert]) { multiPortAlert =>
                  val user = User.fromRoles(email, rolesStr)
                  val allPorts = PortRegion.ports.map(_.iata)
                  val futureResponses = MultiPortAlertClient.saveAlertsForPorts(allPorts, multiPortAlert, user)
                  complete(Future.sequence(futureResponses).map(_ => StatusCodes.Created))
                }
              }
            }
          }
        },
        (get & path("alerts")) {
          authByRole(CreateAlerts) {
            headerValueByName("X-Auth-Roles") { rolesStr =>
              headerValueByName("X-Auth-Email") { email =>
                val user = User.fromRoles(email, rolesStr)

                val futurePortAlerts: Seq[Future[PortAlerts]] = user.accessiblePorts
                  .map { portCode =>
                    DashboardClient.getWithRoles(s"${Dashboard.drtUriForPortCode(portCode)}/alerts/0", user.roles)
                      .flatMap { res =>
                        Unmarshal[HttpEntity](res.entity.withContentType(ContentTypes.`application/json`))
                          .to[List[Alert]]
                          .map(alerts => PortAlerts(portCode, alerts))
                          .recover {
                            case e: Throwable =>
                              log.error(s"Failed to retrieve alerts for $portCode at ${Dashboard.drtUriForPortCode(portCode)}/alerts/0", e)
                              PortAlerts(portCode, List())
                          }
                      }
                  }
                  .toList

                val eventualValue = Future.sequence(futurePortAlerts).map(_.toJson)

                complete(eventualValue)
              }
            }
          }
        },
        (get & path("userDetails" / Segment)) { userEmail =>
          authByRole(ManageUsers) {
            headerValueByName("X-Auth-Roles") { rolesStr =>
              headerValueByName("X-Auth-Email") { email =>
                headerValueByName("X-Auth-Token") { xAuthToken =>
                  log.info(s"request to get user details ${Dashboard.drtUriForPortCode("LHR")}/data/userDetails/$userEmail}")
                  val user = User.fromRoles(email, rolesStr)
                  val keyCloakUser: Future[KeyCloakUser] = DashboardClient
                    .getWithRolesAndKeycloakToken(s"${Dashboard.drtUriForPortCode("LHR")}/data/userDetails/$userEmail", user.roles, xAuthToken)
                    .flatMap { res =>
                      Unmarshal[HttpEntity](res.entity.withContentType(ContentTypes.`application/json`))
                        .to[KeyCloakUser]
                        .recover {
                          case e: Throwable =>
                            log.error(s"Failed at ${Dashboard.drtUriForPortCode("LHR")}/data/userDetails/$userEmail}", e)
                            KeyCloakUser("", "", false, false, "", "", "")
                        }
                    }
                  complete(keyCloakUser)
                }
              }
            }
          }
        },
        (post & path("addUserToGroup" / Segment)) { id =>
          authByRole(ManageUsers) {
            headerValueByName("X-Auth-Roles") { rolesStr =>
              headerValueByName("X-Auth-Email") { email =>
                headerValueByName("X-Auth-Token") { xAuthToken =>
                  entity(as[ClientUserRequestedAccessData]) { userRequestedAccessData =>
                    val user = User.fromRoles(email, rolesStr)
                    if (userRequestedAccessData.portsRequested.nonEmpty || userRequestedAccessData.regionsRequested.nonEmpty) {
                      Future.sequence(userRequestedAccessData.getListOfPortOrRegion.map { port =>
                        DashboardClient
                          .postWithRolesAndKeycloakToken(s"${Dashboard.drtUriForPortCode("LHR")}/data/addUserToGroup/$id/$port", user.roles, xAuthToken)
                      })
                      UserRequestService.updateUserRequest(userRequestedAccessData, "Approved")
                      notifications.sendAccessGranted(userRequestedAccessData.email)
                      complete(s"User ${userRequestedAccessData.email} update port ${userRequestedAccessData.portOrRegionText}")
                    } else {
                      complete("No port or region requested")
                    }
                  }
                }
              }
            }
          }
        },
        (delete & path("alerts" / Segment)) { port =>
          authByRole(CreateAlerts) {
            headerValueByName("X-Auth-Roles") { rolesStr =>
              headerValueByName("X-Auth-Email") { email =>
                val user = User.fromRoles(email, rolesStr)
                val deleteEndpoint = s"${Dashboard.drtUriForPortCode(port)}/alerts"
                complete(DashboardClient.deleteWithRoles(deleteEndpoint, user.roles).map { res =>
                  res.status
                })
              }
            }
          }
        },
        post {
          neboUploadRoute
        })
    }
}

