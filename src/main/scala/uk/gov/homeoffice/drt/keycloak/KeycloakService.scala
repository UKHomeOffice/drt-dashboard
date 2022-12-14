package uk.gov.homeoffice.drt.keycloak

import akka.http.scaladsl.model.HttpResponse
import org.slf4j.{ Logger, LoggerFactory }
import uk.gov.homeoffice.drt.authentication.KeyCloakUser

import scala.concurrent.{ ExecutionContext, Future }

class KeycloakService(keycloakClient: KeycloakClient) {
  val log: Logger = LoggerFactory.getLogger(getClass)

  def getUsersForEmail(email: String): Future[Option[KeyCloakUser]] = {
    keycloakClient.getUsersForEmail(email)
  }

  def removeUser(userId: String) = {
    keycloakClient.removeUser(userId)
  }

  def addUserToGroup(userId: String, group: String)(implicit ec: ExecutionContext) = {
    val keyCloakGroup = keycloakClient.getGroups.map(a => a.find(_.name == group))

    keyCloakGroup.flatMap {
      case Some(kcg) =>
        val response: Future[HttpResponse] = keycloakClient.addUserToGroup(userId, kcg.id)
        response map { r =>
          r.status.intValue match {
            case s if s > 200 && s < 300 =>
              log.info(s"Added group $group  to userId $userId , with response status: ${r.status}  $r")
              r
            case _ => throw new Exception(s"unable to add group $group to userId $userId response from keycloak $response")
          }
        }

      case _ =>
        log.error(s"Unable to add $userId to $group")
        Future.failed(new Exception(s"Unable to add $userId to $group"))
    }
  }

  def logout(username: String)(implicit ec: ExecutionContext) = {
    keycloakClient.getUsersForUsername(username)
      .map(u =>
        u.map { ud =>
          keycloakClient.logoutUser(ud.id)
        })
  }

}

