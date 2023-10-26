package uk.gov.homeoffice.drt.db

import slick.jdbc.PostgresProfile.api._
import slick.lifted.{ProvenShape, TableQuery, Tag}
import spray.json.RootJsonFormat
import uk.gov.homeoffice.drt.authentication.AccessRequest

import java.sql.Timestamp
import java.time.{Duration, Instant, LocalDateTime, ZoneOffset}
import scala.concurrent.{ExecutionContext, Future}

trait UserAccessRequestJsonSupport extends DateTimeJsonSupport {
  implicit val userAccessRequestFormatParser: RootJsonFormat[UserAccessRequest] = jsonFormat12(UserAccessRequest)
}

case class UserAccessRequest(
  email: String,
  portsRequested: String,
  allPorts: Boolean,
  regionsRequested: String,
  staffEditing: Boolean,
  lineManager: String,
  agreeDeclaration: Boolean,
  accountType: String,
  portOrRegionText: String,
  staffText: String,
  status: String,
  requestTime: java.sql.Timestamp)

class UserAccessRequestsTable(tag: Tag) extends Table[UserAccessRequest](tag, "user_access_requests") {

  def email = column[String]("email")

  def allPorts = column[Boolean]("all_ports")

  def portsRequested = column[String]("ports")

  def regionsRequested = column[String]("regions")

  def staffing = column[Boolean]("staff_editing")

  def lineManager = column[String]("line_manager")

  def agreeDeclaration = column[Boolean]("agree_declaration")

  def accountType = column[String]("account_type")

  def portOrRegionText = column[String]("port_or_region_text")

  def staffText = column[String]("staff_text")

  def status = column[String]("status")

  def requestTime = column[java.sql.Timestamp]("request_time")

  val pk = primaryKey("user_access_requests_pkey", (email, requestTime))

  def * : ProvenShape[UserAccessRequest] = (email, portsRequested, allPorts, regionsRequested, staffing, lineManager, agreeDeclaration, accountType, portOrRegionText, staffText, status, requestTime).mapTo[UserAccessRequest]
}

trait IUserAccessRequestDao {
  def getUserAccessRequest(email: String, accessRequest: AccessRequest, timestamp: java.sql.Timestamp, status: String): UserAccessRequest = {
    UserAccessRequest(
      email = email,
      portsRequested = accessRequest.portsRequested.mkString(","),
      allPorts = accessRequest.allPorts,
      regionsRequested = accessRequest.regionsRequested.mkString(","),
      staffEditing = accessRequest.staffing,
      lineManager = accessRequest.lineManager,
      agreeDeclaration = accessRequest.agreeDeclaration,
      accountType = accessRequest.rccOption,
      portOrRegionText = accessRequest.portOrRegionText,
      staffText = accessRequest.staffText,
      status = status,
      requestTime = timestamp)
  }

  def insertOrUpdate(userAccessRequest: UserAccessRequest): Future[Int]

  def selectAll()(implicit executionContext: ExecutionContext): Future[Seq[UserAccessRequest]]

  def selectForStatus(status: String): Future[Seq[UserAccessRequest]]

  def selectApprovedUserAfterSpecificDate(): Future[Seq[UserAccessRequest]]

}

case class UserAccessRequestDao(db: Database) extends IUserAccessRequestDao {
  val userAccessRequests: TableQuery[UserAccessRequestsTable] = TableQuery[UserAccessRequestsTable]

  def insertOrUpdate(userAccessRequest: UserAccessRequest): Future[Int] = {
    db.run(userAccessRequests insertOrUpdate userAccessRequest)
  }

  def selectAll()(implicit executionContext: ExecutionContext): Future[Seq[UserAccessRequest]] = {
    db.run(userAccessRequests.result).mapTo[Seq[UserAccessRequest]]
  }

  def selectForStatus(status: String): Future[Seq[UserAccessRequest]] = {
    db.run(userAccessRequests.filter(_.status === status).result)
  }

  def selectApprovedUserAfterSpecificDate(): Future[Seq[UserAccessRequest]] = {
    val specificDate = Timestamp.from(LocalDateTime.of(2023, 9, 1, 0, 0).toInstant(ZoneOffset.UTC))
    val fifteenDaysAgo = Timestamp.from(Instant.now.minus(Duration.ofDays(15)))

    db.run(userAccessRequests.filter(u =>
      u.status === "Approved" &&
        u.requestTime > specificDate &&
        u.requestTime < fifteenDaysAgo
    ).result)

  }
}
