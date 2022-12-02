package uk.gov.homeoffice.drt.services

import uk.gov.homeoffice.drt.db.{ User, UserDao }

import scala.concurrent.ExecutionContext

object UserService {
  def getUser()(implicit ec: ExecutionContext) = {
    UserDao.selectAll
  }

  def inactiveUserCheck()(implicit ec: ExecutionContext) = {
    UserDao.filterInactive()
  }

  def getUserToRevoke()(implicit ec: ExecutionContext) = {
    UserDao.filterUserToRevoke()
  }

  def upsertUser(userData: User)(implicit ec: ExecutionContext) = {
    UserDao.insertOrUpdate(userData)
  }

}
