package uk.gov.homeoffice.drt.db

import org.joda.time.DateTime
import slick.jdbc.PostgresProfile.api._
import slick.lifted.ProvenShape
import java.sql.Timestamp
import scala.concurrent.Future

case class SeminarsRegistrationRow(email: String,
                                   seminarId: Int,
                                   registeredAt: Timestamp,
                                   emailSentAt: Option[Timestamp])

class SeminarsRegistrationTable(tag: Tag) extends Table[SeminarsRegistrationRow](tag, "seminar_registration") {

  def email: Rep[String] = column[String]("email")

  def seminarId: Rep[Int] = column[Int]("seminar_id")

  def registeredAt: Rep[Timestamp] = column[Timestamp]("registered_at")

  def emailSentAt: Rep[Option[Timestamp]] = column[Option[Timestamp]]("email_sent_at")

  def * : ProvenShape[SeminarsRegistrationRow] = (email, seminarId, registeredAt, emailSentAt).mapTo[SeminarsRegistrationRow]

  val pk = primaryKey("seminar_registration_pkey", (email, seminarId))

}


case class SeminarRegisterDao(db: Database) {
  val seminarsRegistrationTable = TableQuery[SeminarsRegistrationTable]

  private def getCurrentTime = new Timestamp(new DateTime().getMillis)

  def updateEmailSentTime(seminarId: String) = {
    val query = seminarsRegistrationTable.filter(_.seminarId === seminarId.trim.toInt).map(f => (f.emailSentAt))
      .update(Some(getCurrentTime))
    db.run(query)
  }

  def removeRegisteredUser(seminarId: String, email: String): Future[Int] = {
    val query = seminarsRegistrationTable.filter(r => r.seminarId === seminarId.trim.toInt && r.email === email.trim).delete
    db.run(query)
  }

  def getRegisteredUsers(seminarId: String): Future[Seq[SeminarsRegistrationRow]] = {
    val query = seminarsRegistrationTable.filter(_.seminarId === seminarId.trim.toInt).sortBy(_.registeredAt.desc).result
    val result = db.run(query)
    result
  }

  def getRegisteredUsersToNotify(seminarId: String, seminarDate: Timestamp): Future[Seq[SeminarsRegistrationRow]] = {

    val sevenDaysMilliSeconds = 7L * 24L * 60L * 60L * 1000L
    val numberOfDaysBeforeSeminar = new Timestamp(seminarDate.getTime - sevenDaysMilliSeconds)

    val query = seminarsRegistrationTable
      .filter(r => r.seminarId === seminarId.trim.toInt && r.emailSentAt.map(es => es < numberOfDaysBeforeSeminar).getOrElse(true))
      .sortBy(_.registeredAt.desc).result

    val result = db.run(query)
    result
  }

}
