package uk.gov.homeoffice.drt.services

import uk.gov.homeoffice.drt.ServerConfig
import uk.gov.homeoffice.drt.db.{SeminarDao, SeminarRegisterDao, SeminarsRegistrationRow}
import uk.gov.homeoffice.drt.notifications.EmailNotifications

import scala.concurrent.{ExecutionContext, Future}

class SeminarService(seminarDao: SeminarDao, seminarRegisterDao: SeminarRegisterDao, serverConfig: ServerConfig) {

  def usersToRemind(notifications: EmailNotifications)(implicit ec: ExecutionContext) = {
    seminarDao.getSeminarsWithInNotifyDate().map { seminarsToNotify =>
      seminarsToNotify.foreach { seminar =>
        seminar.id
          .map(id => seminarRegisterDao
            .getUsersToNotify(id.toString, seminar.startTime))
          .getOrElse(Future.successful(Seq.empty[SeminarsRegistrationRow]))
          .map { usersToNotify =>
            usersToNotify.map(user => notifications.sendSeminarReminderEmail(user.email, "lhr", seminar, serverConfig.useHttps, serverConfig.rootDomain, serverConfig.teamEmail))
            usersToNotify.map(user => seminarRegisterDao.updateEmailSentTime(user.seminarId.toString))
          }
      }
    }
  }

}
