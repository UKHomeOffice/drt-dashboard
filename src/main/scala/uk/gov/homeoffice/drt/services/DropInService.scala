package uk.gov.homeoffice.drt.services

import org.joda.time.DateTime
import uk.gov.homeoffice.drt.db.{DropInDao, DropInRegistrationDao, DropInRegistrationRow, User, UserAccessRequest}
import uk.gov.homeoffice.drt.notifications.EmailNotifications
import java.sql.Timestamp
import scala.concurrent.{ExecutionContext, Future}

class DropInService(dropInDao: DropInDao, dropInRegistrationDao: DropInRegistrationDao, userService: UserService, userRequestService: UserRequestService, teamEmail: String) {

  def sendSeminarReminders(notifications: EmailNotifications)(implicit ec: ExecutionContext): Future[Unit] = {
    val notifyDate: Long = DateTime.now().withTimeAtStartOfDay.plusDays(7).getMillis
    val presentDate: Long = DateTime.now().withTimeAtStartOfDay().minusDays(1).getMillis
    dropInDao.getDropInDueForNotifying(notifyDate, presentDate).map { dropInsToNotify =>
      dropInsToNotify.foreach { dropIn =>
        dropIn.id
          .map(id => dropInRegistrationDao.getRegisteredUsersToNotify(id.toString, dropIn.startTime))
          .getOrElse(Future.successful(Seq.empty[DropInRegistrationRow]))
          .map { usersToNotify =>
            usersToNotify.map(user => notifications.sendDropInReminderEmail(user.email, dropIn, teamEmail))
            usersToNotify.map(user => dropInRegistrationDao.updateEmailSentTime(user.dropInId.toString))
          }
      }
    }
  }


  def sendDropInNotificationToNewUsers(notifications: EmailNotifications, rootDomain: String)(implicit ec: ExecutionContext) = {
    val approvedUsers: Future[Seq[UserAccessRequest]] = userRequestService.getApprovedUserAfterSpecificDate()
    val usersWithoutDropInNotification: Future[Seq[User]] = userService.getUsersWithoutDropInNotification

    val userToNotify: Future[Seq[UserAccessRequest]] = for {
      approved <- approvedUsers
      withoutNotification <- usersWithoutDropInNotification
    } yield {
      val notifyEmails = withoutNotification.map(_.email)
      approved.filter(a => notifyEmails.contains(a.email))
    }

    userToNotify.flatMap { users =>
      Future.sequence(users.map { user =>
        dropInRegistrationDao.findRegisteredUser(user.email).flatMap {
          case list if list.isEmpty =>
            notifications.sendDropInNotification(user, rootDomain, teamEmail)
            usersWithoutDropInNotification
              .map { ud =>
                ud.filter(_.email == user.email)
                  .map { u =>
                    userService.upsertUser(u.copy(drop_in_notification = Option(new Timestamp(new DateTime().getMillis))))
                  }
              }
          case _ =>
            Future.successful(0)
        }
      })
    }
  }

}
