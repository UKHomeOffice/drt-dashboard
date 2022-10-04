package uk.gov.homeoffice.drt

import akka.actor.ClassicActorSystemProvider
import akka.http.scaladsl.Http
import akka.http.scaladsl.client.RequestBuilding.{ Delete, Get, Post }
import akka.http.scaladsl.model.HttpHeader.ParsingResult.Ok
import akka.http.scaladsl.model._
import uk.gov.homeoffice.drt.auth.Roles.Role

import scala.concurrent.Future

object DashboardClient {
  def get(uri: String)(implicit system: ClassicActorSystemProvider): Future[HttpResponse] = {
    Http().singleRequest(HttpRequest(HttpMethods.GET, uri))
  }

  def postWithRolesAndKeycloakToken(uri: String, roles: Iterable[Role], keyCloakToken: String)(implicit system: ClassicActorSystemProvider): Future[HttpResponse] = {
    val keyCloakHeader = HttpHeader.parse("X-Auth-Token", keyCloakToken) match {
      case Ok(header, _) => Option(header)
      case _ => None
    }
    Http().singleRequest(Post(uri).withHeaders(keyCloakHeader.toList ::: rolesToRoleHeader(roles)))
  }

  def getWithRolesAndKeycloakToken(uri: String, roles: Iterable[Role], keyCloakToken: String)(implicit system: ClassicActorSystemProvider): Future[HttpResponse] = {
    val keyCloakHeader = HttpHeader.parse("X-Auth-Token", keyCloakToken) match {
      case Ok(header, _) => Option(header)
      case _ => None
    }
    Http().singleRequest(Get(uri).withHeaders(keyCloakHeader.toList ::: rolesToRoleHeader(roles)))
  }

  def getWithRoles(uri: String, roles: Iterable[Role])(implicit system: ClassicActorSystemProvider): Future[HttpResponse] =
    Http().singleRequest(Get(uri).withHeaders(rolesToRoleHeader(roles)))

  def postWithRoles(uri: String, json: String, roles: Iterable[Role])(implicit system: ClassicActorSystemProvider): Future[HttpResponse] =

    Http().singleRequest(Post(uri, HttpEntity(ContentTypes.`text/plain(UTF-8)`, json)).withHeaders(rolesToRoleHeader(roles)))

  def deleteWithRoles(uri: String, roles: Iterable[Role])(implicit system: ClassicActorSystemProvider): Future[HttpResponse] =
    Http().singleRequest(Delete(uri).withHeaders(rolesToRoleHeader(roles)))

  def rolesToRoleHeader(roles: Iterable[Role]): List[HttpHeader] = {
    val roleHeader: Option[HttpHeader] = HttpHeader
      .parse("X-Auth-Roles", roles.map(_.name.toLowerCase).mkString(",")) match {
        case Ok(header, _) => Option(header)
        case _ => None
      }
    roleHeader.toList
  }

}
