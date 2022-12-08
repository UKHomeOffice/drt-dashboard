package uk.gov.homeoffice.drt.keycloak

import akka.actor.ActorSystem
import akka.actor.typed.scaladsl.Behaviors
import akka.actor.typed.{ ActorRef, Behavior }
import uk.gov.homeoffice.drt.KeyClockConfig
import uk.gov.homeoffice.drt.http.ProdSendAndReceive
import uk.gov.homeoffice.drt.schedule.UserTracking.{ Command, KeyCloakToken }

import java.time.Instant
import scala.concurrent.{ ExecutionContext, Future }

case class TokenData(username: String, creationTime: Long, keyCloakAuthToken: KeyCloakAuthToken)

object KeyCloakAuthTokenService {
  trait Token

  final case class GetToken(replyTo: ActorRef[Command]) extends Token

  var manageUserToken: Option[TokenData] = None

  def getKeyClockClient(url: String, keyCloakAuthToken: KeyCloakAuthToken)(implicit actorSystem: ActorSystem, ec: ExecutionContext): KeycloakClient with ProdSendAndReceive = {
    new KeycloakClient(keyCloakAuthToken.accessToken, url) with ProdSendAndReceive
  }

  def getTokenBehavior(keyClockConfig: KeyClockConfig, manageUsername: String, managePassword: String): Behavior[Token] = {
    Behaviors.setup { context =>
      Behaviors.receiveMessage {
        case GetToken(replyTo) =>
          context.log.info("GetToken by {}", replyTo)
          implicit val as = context.system.classicSystem
          implicit val ec = as.dispatcher
          getManageUserToken(keyClockConfig, manageUsername, managePassword).map(KeyCloakToken).map(replyTo ! _)
          Behaviors.same
      }
    }
  }

  def isTokenExpired(tokenData: TokenData): Boolean = {
    Instant.now().getEpochSecond - (tokenData.creationTime + tokenData.keyCloakAuthToken.expiresIn) > 0
  }

  def getTokenFromFuture(manageUsername: String, keyCloakAuthTokenF: Future[KeyCloakAuthResponse])(implicit actorSystem: ActorSystem): Future[KeyCloakAuthToken] = {
    implicit val ec = actorSystem.dispatcher
    keyCloakAuthTokenF.map { keyCloakAuthResponse =>
      val KeyCloakAuthToken = keyCloakAuthResponse.asInstanceOf[KeyCloakAuthToken]
      manageUserToken = Some(TokenData(manageUsername, Instant.now().getEpochSecond, KeyCloakAuthToken))
      KeyCloakAuthToken
    }
  }

  def getManageUserToken(keyClockConfig: KeyClockConfig, manageUsername: String, managePassword: String)(implicit actorSystem: ActorSystem): Future[KeyCloakAuthToken] = {
    manageUserToken match {
      case Some(tokenData) => if (isTokenExpired(tokenData)) {
        getTokenFromFuture(manageUsername, getUserToken(keyClockConfig, manageUsername, managePassword))
      } else Future.successful(tokenData.keyCloakAuthToken)
      case None =>
        getTokenFromFuture(manageUsername, getUserToken(keyClockConfig, manageUsername, managePassword))
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

}

