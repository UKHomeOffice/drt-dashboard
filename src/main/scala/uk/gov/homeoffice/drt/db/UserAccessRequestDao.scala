package uk.gov.homeoffice.drt.db

import slick.jdbc.PostgresProfile.api._
import slick.lifted.Tag
import uk.gov.homeoffice.drt.authentication.AccessRequest
import uk.gov.homeoffice.drt.services.UserRequestService.log

case class UserAccessRequest(
  email: String,
  portsRequested: String,
  allPorts: Boolean,
  regionsRequested: String,
  staffing: Boolean,
  lineManager: String,
  agreeDeclaration: Boolean,
  rccOption: Boolean,
  portOrRegionText: String,
  staffText: String,
  status: String,
  requestTime: java.sql.Timestamp)

class UserAccessRequestsTable(tag: Tag) extends Table[UserAccessRequest](tag, "user_access_requests") {

  def email = column[String]("email", O.PrimaryKey)

  def allPorts = column[Boolean]("all_ports")

  def portsRequested = column[String]("ports")

  def regionsRequested = column[String]("regions")

  def staffing = column[Boolean]("staffing")

  def lineManager = column[String]("line_manager")

  def agreeDeclaration = column[Boolean]("agree_declaration")

  def rccOption = column[Boolean]("rcc_option")

  def portOrRegionText = column[String]("port_or_region_text")

  def staffText = column[String]("staff_text")

  def status = column[String]("status")

  def requestTime = column[java.sql.Timestamp]("request_time", O.PrimaryKey)

  def * = (email, portsRequested, allPorts, regionsRequested, staffing, lineManager, agreeDeclaration, rccOption, portOrRegionText, staffText, status, requestTime).mapTo[UserAccessRequest]
}

object UserAccessRequestDao {
  val userAccessRequests = TableQuery[UserAccessRequestsTable]

  def getUserAccessRequest(email: String, accessRequest: AccessRequest, timestamp: java.sql.Timestamp, status: String) = {
    UserAccessRequest(
      email = email,
      portsRequested = accessRequest.portsRequested.mkString(","),
      allPorts = accessRequest.allPorts,
      regionsRequested = accessRequest.regionsRequested.mkString(","),
      staffing = accessRequest.staffing,
      lineManager = accessRequest.lineManager,
      agreeDeclaration = accessRequest.agreeDeclaration,
      rccOption = accessRequest.rccOption.contains("rccu"),
      portOrRegionText = accessRequest.portOrRegionText,
      staffText = accessRequest.staffText,
      status = status,
      requestTime = timestamp)
  }

  def insert(userAccessRequest: UserAccessRequest) = {
    log.info(s"userAccessRequest $userAccessRequest")
    userAccessRequests insertOrUpdate userAccessRequest
  }

  def select(email: String) = {
    userAccessRequests.filter(_.email === email)
  }
}