package uk.gov.homeoffice.drt.services

import uk.gov.homeoffice.drt.db.{ IUserDao, User, UserDao }

import scala.concurrent.ExecutionContext

class UserService(userDao: IUserDao) {
  def getUser()(implicit ec: ExecutionContext) = {
    userDao.selectAll
  }

  def inactiveUserCheck(numberOfInactivityDays: Int)(implicit ec: ExecutionContext) = {
    userDao.filterInactive(numberOfInactivityDays)
  }

  def getUserToRevoke()(implicit ec: ExecutionContext) = {
    userDao.filterUserToRevoke()
  }

  def upsertUser(userData: User)(implicit ec: ExecutionContext) = {
    userDao.insertOrUpdate(userData)
  }

}
