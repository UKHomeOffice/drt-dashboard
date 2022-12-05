package uk.gov.homeoffice.drt.services

import uk.gov.homeoffice.drt.db.{ User, UserDao }

import scala.concurrent.ExecutionContext

object UserService {
  def getUser()(implicit ec: ExecutionContext) = {
    UserDao.selectAll
  }

  def inactiveUserCheck(numberOfInactivityDays: Int)(implicit ec: ExecutionContext) = {
    UserDao.filterInactive(numberOfInactivityDays)
  }

  def getUserToRevoke()(implicit ec: ExecutionContext) = {
    UserDao.filterUserToRevoke()
  }

  def upsertUser(userData: User)(implicit ec: ExecutionContext) = {
    UserDao.insertOrUpdate(userData)
  }

}
