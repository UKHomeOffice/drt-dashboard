package uk.gov.homeoffice.drt.services

import org.joda.time.DateTime
import uk.gov.homeoffice.drt.ServerConfig
import uk.gov.homeoffice.drt.db.{SeminarDao, SeminarRegisterDao, SeminarsRegistrationRow}
import uk.gov.homeoffice.drt.notifications.EmailNotifications

import scala.concurrent.{ExecutionContext, Future}

class SeminarService(seminarDao: SeminarDao, seminarRegisterDao: SeminarRegisterDao, serverConfig: ServerConfig) {

  def sendSeminarReminders(notifications: EmailNotifications)(implicit ec: ExecutionContext): Future[Unit] = {
    val notifyDate: Long = DateTime.now().withTimeAtStartOfDay.plusDays(7).getMillis
    val presentDate: Long = DateTime.now().withTimeAtStartOfDay().minusDays(1).getMillis
    seminarDao.getSeminarsDueForNotifying(notifyDate, presentDate).map { seminarsToNotify =>
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
