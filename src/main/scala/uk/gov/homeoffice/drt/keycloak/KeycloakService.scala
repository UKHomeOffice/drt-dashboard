package uk.gov.homeoffice.drt.keycloak

import akka.actor.ActorSystem
import uk.gov.homeoffice.drt.KeyClockConfig
import uk.gov.homeoffice.drt.authentication.KeyCloakUser
import uk.gov.homeoffice.drt.http.ProdSendAndReceive

import java.time.Instant
import scala.concurrent.duration.DurationInt
import scala.concurrent.{ Await, ExecutionContext, Future }

case class TokenData(username: String, creationTime: Long, keyCloakAuthToken: KeyCloakAuthToken)

object KeycloakService {
  var manageUserToken: Option[TokenData] = None

  def isTokenExpired(tokenData: TokenData): Boolean = {
    Instant.now().getEpochSecond - (tokenData.creationTime + tokenData.keyCloakAuthToken.expiresIn) > 0
  }

  def getTokenFromFuture(keyCloakAuthToken: Future[KeyCloakAuthResponse]): KeyCloakAuthToken = {
    Await.result(keyCloakAuthToken, 2.seconds).asInstanceOf[KeyCloakAuthToken]
  }

  def getManageUserToken(keyClockConfig: KeyClockConfig, manageUsername: String, managePassword: String)(implicit actorSystem: ActorSystem): KeyCloakAuthToken = {
    manageUserToken match {
      case Some(tokenData) => if (isTokenExpired(tokenData)) {
        val keyCloakAuthToken = getTokenFromFuture(getUserToken(keyClockConfig, manageUsername, managePassword))
        manageUserToken = Some(TokenData(manageUsername, Instant.now().getEpochSecond, keyCloakAuthToken))
        keyCloakAuthToken
      } else tokenData.keyCloakAuthToken
      case None =>
        val keyCloakAuthToken = getTokenFromFuture(getUserToken(keyClockConfig, manageUsername, managePassword))
        manageUserToken = Some(TokenData(manageUsername, Instant.now().getEpochSecond, keyCloakAuthToken))
        keyCloakAuthToken
    }
  }

  def getUserToken(keyClockConfig: KeyClockConfig, username: String, password: String)(implicit actorSystem: ActorSystem): Future[KeyCloakAuthResponse] = {
    implicit val ec = actorSystem.dispatcher
    val authClient = new KeyCloakAuth(
      keyClockConfig.tokenUrl,
      keyClockConfig.clientId,
      keyClockConfig.clientSecret) with ProdSendAndReceive
    authClient.getToken(username, password)
  }

  def getKeyClockClient(url: String, keyCloakAuthToken: KeyCloakAuthToken)(implicit actorSystem: ActorSystem, ec: ExecutionContext) = {
    new KeycloakClient(keyCloakAuthToken.accessToken, url) with ProdSendAndReceive
  }
}

class KeycloakService(keycloakClient: KeycloakClient) {

  def getUsersForEmail(email: String): Future[Option[KeyCloakUser]] = {
    keycloakClient.getUsersForEmail(email)
  }

  def removeUser(userId: String) = {
    keycloakClient.removeUser(userId)
  }

  def logout(username: String)(implicit ec: ExecutionContext) = {
    keycloakClient.getUsersForUsername(username)
      .map(u =>
        u.map { ud =>
          keycloakClient.logoutUser(ud.id)
        })
  }

}

