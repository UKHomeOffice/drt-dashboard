package uk.gov.homeoffice.drt.routes

import akka.http.scaladsl.marshallers.sprayjson.SprayJsonSupport._
import akka.http.scaladsl.model.StatusCodes
import akka.http.scaladsl.server.Directives._
import org.slf4j.{Logger, LoggerFactory}
import spray.json.{RootJsonFormat, enrichAny}
import uk.gov.homeoffice.drt.db.{SeminarRegisterDao, SeminarsRegistrationRow}

import scala.concurrent.ExecutionContext

trait SeminarRegisterJsonFormats extends DefaultTimeJsonProtocol {

  implicit val seminarRowFormatParser: RootJsonFormat[SeminarsRegistrationRow] = jsonFormat4(SeminarsRegistrationRow)

}

object SeminarRegisterRoutes extends BaseRoute with SeminarRegisterJsonFormats {
  override val log: Logger = LoggerFactory.getLogger(getClass)

  def removeUser(seminarRegisterDao: SeminarRegisterDao)(implicit ec: ExecutionContext) =
    path("remove" / Segment / Segment) { (seminarId, email) =>
      delete {
        val removedUserResult = seminarRegisterDao.removeUser(seminarId, email)
        routeResponse(removedUserResult.map(_ => complete(StatusCodes.OK, s"User $email is removed from seminar successfully")), "Removing User from Seminar")
      }
    }

  def getRegisteredUsers(seminarRegisterDao: SeminarRegisterDao)(implicit ec: ExecutionContext) = path("users" / Segment) { seminarId =>
    get {
      val registeredUsersResult = seminarRegisterDao.getRegisteredUsers(seminarId)
      routeResponse(registeredUsersResult.map(forms => complete(StatusCodes.OK, forms.toJson)), "Getting registered seminar users")
    }
  }

  def apply(prefix: String, seminarRegisterDao: SeminarRegisterDao)(implicit ec: ExecutionContext) = pathPrefix(prefix) {
    concat(getRegisteredUsers(seminarRegisterDao) ~ removeUser(seminarRegisterDao))
  }
}
