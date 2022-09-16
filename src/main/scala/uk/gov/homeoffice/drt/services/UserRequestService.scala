package uk.gov.homeoffice.drt.services

import org.joda.time.DateTime
import org.slf4j.{ Logger, LoggerFactory }
import uk.gov.homeoffice.drt.authentication.AccessRequest
import uk.gov.homeoffice.drt.db.UserAccessRequestDao

import java.sql.Timestamp

object UserRequestService {
  val log: Logger = LoggerFactory.getLogger(getClass)

  def saveUserRequest(email: String, accessRequest: AccessRequest) = {
    log.info(s"request for access $email $accessRequest")
    val userAccessRequest = UserAccessRequestDao.getUserAccessRequest(email, accessRequest, new Timestamp(DateTime.now().getMillis), "requested")
    UserAccessRequestDao.insert(userAccessRequest)
  }
}
