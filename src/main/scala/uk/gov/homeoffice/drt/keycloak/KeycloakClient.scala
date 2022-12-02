package uk.gov.homeoffice.drt.keycloak

import akka.actor.ActorSystem
import akka.http.scaladsl.marshallers.sprayjson.SprayJsonSupport
import akka.http.scaladsl.model._
import akka.http.scaladsl.model.headers.{ Accept, Authorization, OAuth2BearerToken }
import akka.http.scaladsl.unmarshalling.Unmarshal
import akka.stream.Materializer
import akka.util.Timeout
import org.slf4j.{ Logger, LoggerFactory }
import spray.json.{ DefaultJsonProtocol, JsObject, JsValue, RootJsonFormat }
import uk.gov.homeoffice.drt.authentication.{ KeyCloakGroup, KeyCloakUser }
import uk.gov.homeoffice.drt.http.WithSendAndReceive

import scala.concurrent.duration._
import scala.concurrent.{ Await, Future }
import scala.language.postfixOps

abstract case class KeycloakClient(token: String, keyCloakUrl: String)(implicit val system: ActorSystem, mat: Materializer)
  extends WithSendAndReceive with KeyCloakUserParserProtocol {

  import KeyCloakUserFormatParser._
  import system.dispatcher

  def log: Logger = LoggerFactory.getLogger(getClass)

  implicit val timeout: Timeout = Timeout(1 minute)

  def logResponse(requestName: String, resp: HttpResponse): HttpResponse = {
    if (resp.status.isFailure)
      log.error(s"Error when calling $requestName on KeyCloak API Status code: ${resp.status} Response:<${resp.entity.toString}>")

    resp
  }

  def pipeline(method: HttpMethod, uri: String, requestName: String, requestEntity: RequestEntity = HttpEntity.Empty): Future[HttpResponse] = {
    val request = HttpRequest(method, Uri(uri), entity = requestEntity)
    val requestWithHeaders = request
      .addHeader(Accept(MediaTypes.`application/json`))
      .addHeader(Authorization(OAuth2BearerToken(token)))
    sendAndReceive(requestWithHeaders).map { r =>
      logResponse(requestName, r)
      r
    }
  }

  def getUsersForEmail(email: String): Future[Option[KeyCloakUser]] = {
    val uri = keyCloakUrl + s"/users?email=$email"
    log.info(s"Calling key cloak: $uri")
    pipeline(HttpMethods.GET, uri, "getUsersForEmail")
      .flatMap { r => Unmarshal(r).to[List[KeyCloakUser]] }.map(_.headOption)
  }

  def getUsersForUsername(username: String): Future[Option[KeyCloakUser]] = {
    val uri = keyCloakUrl + s"/users?username=$username"
    log.info(s"Calling key cloak: $uri")
    pipeline(HttpMethods.GET, uri, "getUsersForUsername")
      .flatMap { r => Unmarshal(r).to[List[KeyCloakUser]] }.map(_.headOption)
  }

  def getUsers(max: Int = 100, offset: Int = 0): Future[List[KeyCloakUser]] = {
    val uri = keyCloakUrl + s"/users?max=$max&first=$offset"
    log.info(s"Calling key cloak: $uri")
    pipeline(HttpMethods.GET, uri, "getUsers").flatMap { r => Unmarshal(r).to[List[KeyCloakUser]] }
  }

  def getAllUsers(offset: Int = 0): Seq[KeyCloakUser] = {

    val users = Await.result(getUsers(50, offset), 2 seconds)

    if (users.isEmpty) Nil else users ++ getAllUsers(offset + 50)
  }

  def getUserGroups(userId: String): Future[List[KeyCloakGroup]] = {
    val uri = keyCloakUrl + s"/users/$userId/groups"
    log.info(s"Calling key cloak: $uri")
    pipeline(HttpMethods.GET, uri, "getUserGroups").flatMap { r => Unmarshal(r).to[List[KeyCloakGroup]] }
  }

  def getGroups: Future[List[KeyCloakGroup]] = {
    val uri = keyCloakUrl + "/groups"
    log.info(s"Calling key cloak: $uri")
    pipeline(HttpMethods.GET, uri, "getGroups").flatMap { r => Unmarshal(r).to[List[KeyCloakGroup]] }
  }

  def getUsersInGroup(groupName: String, max: Int = 1000): Future[List[KeyCloakUser]] = {
    val futureMaybeId: Future[Option[String]] = getGroups.map(gs => gs.find(_.name == groupName).map(_.id))

    futureMaybeId.flatMap {
      case Some(id) =>
        val uri = keyCloakUrl + s"/groups/$id/members?max=$max"
        pipeline(HttpMethods.GET, uri, "getUsersInGroup").flatMap { r => Unmarshal(r).to[List[KeyCloakUser]] }
      case None => Future(List())
    }
  }

  def getUsersNotInGroup(groupName: String): Future[List[KeyCloakUser]] = {

    val futureUsersInGroup: Future[List[KeyCloakUser]] = getUsersInGroup(groupName)
    val futureAllUsers: Future[List[KeyCloakUser]] = getUsers()

    for {
      usersInGroup <- futureUsersInGroup
      allUsers <- futureAllUsers
    } yield allUsers.filterNot(usersInGroup.toSet)
  }

  def addUserToGroup(userId: String, groupId: String): Future[HttpResponse] = {
    log.info(s"Adding $userId to $groupId")
    val uri = s"$keyCloakUrl/users/$userId/groups/$groupId"
    pipeline(HttpMethods.PUT, uri, "addUserToGroup")
  }

  def removeUser(userId: String): Future[HttpResponse] = {
    log.info(s"Removing $userId")
    val uri = s"$keyCloakUrl/users/$userId"
    pipeline(HttpMethods.DELETE, uri, "removeUserFromGroup")
  }

  def logoutUser(userId: String): Future[HttpResponse] = {
    log.info(s"Logout $userId")
    val uri = s"$keyCloakUrl/users/$userId/logout"
    pipeline(HttpMethods.POST, uri, "logoutUser")
  }
}

trait KeyCloakUserParserProtocol extends DefaultJsonProtocol with SprayJsonSupport {

  implicit object KeyCloakUserFormatParser extends RootJsonFormat[KeyCloakUser] {
    override def write(obj: KeyCloakUser): JsValue = throw new Exception("KeyCloakUser writer not implemented")

    override def read(json: JsValue): KeyCloakUser = json match {
      case JsObject(fields) =>
        KeyCloakUser(
          fields.get("id").map(_.convertTo[String]).getOrElse(""),
          fields.get("username").map(_.convertTo[String]).getOrElse(""),
          fields.get("enabled").exists(_.convertTo[Boolean]),
          fields.get("emailVerified").exists(_.convertTo[Boolean]),
          fields.get("firstName").map(_.convertTo[String]).getOrElse(""),
          fields.get("lastName").map(_.convertTo[String]).getOrElse(""),
          fields.get("email").map(_.convertTo[String]).getOrElse(""))
    }
  }

  implicit val keyCloakGroupFormat: RootJsonFormat[KeyCloakGroup] = jsonFormat3(KeyCloakGroup)

}

object KeyCloakUserParserProtocol extends KeyCloakUserParserProtocol

