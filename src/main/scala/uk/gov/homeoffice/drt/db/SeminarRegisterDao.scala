package uk.gov.homeoffice.drt.db

import org.joda.time.DateTime
import slick.jdbc.PostgresProfile.api._
import slick.lifted.ProvenShape
import java.sql.Timestamp
import scala.concurrent.Future

case class SeminarsRegistrationRow(email: String,
                                   seminarId: Int,
                                   registerTime: Timestamp,
                                   emailSent: Option[Timestamp])

class SeminarsRegistrationTable(tag: Tag) extends Table[SeminarsRegistrationRow](tag, "seminar_registration") {

  def email: Rep[String] = column[String]("email")

  def seminarId: Rep[Int] = column[Int]("seminar_id")

  def registerTime: Rep[Timestamp] = column[Timestamp]("register_time")

  def emailSent: Rep[Option[Timestamp]] = column[Option[Timestamp]]("email_sent")

  def * : ProvenShape[SeminarsRegistrationRow] = (email, seminarId, registerTime, emailSent).mapTo[SeminarsRegistrationRow]

  val pk = primaryKey("seminar_registration_pkey", (email, seminarId))

}


case class SeminarRegisterDao(db: Database) {
  val seminarsRegistrationTable = TableQuery[SeminarsRegistrationTable]

  private def getCurrentTime = new Timestamp(new DateTime().getMillis)

  def updateEmailSentTime(seminarId: String) = {
    val query = seminarsRegistrationTable.filter(_.seminarId === seminarId.trim.toInt).map(f => (f.emailSent))
      .update(Some(getCurrentTime))
    db.run(query)
  }

  def removeUser(seminarId: String, email: String): Future[Int] = {
    val query = seminarsRegistrationTable.filter(r => r.seminarId === seminarId.trim.toInt && r.email === email.trim).delete
    db.run(query)
  }

  def getRegisterUsers(seminarId: String): Future[Seq[SeminarsRegistrationRow]] = {
    val query = seminarsRegistrationTable.filter(_.seminarId === seminarId.trim.toInt).sortBy(_.registerTime.desc).result
    val result = db.run(query)
    result
  }

  def getUsersToNotify(seminarId: String, seminarDate: Timestamp): Future[Seq[SeminarsRegistrationRow]] = {

    val fourteenDaysBeforeSeminar = new Timestamp(seminarDate.getTime - 14L * 24L * 60L * 60L * 1000L)

    val query = seminarsRegistrationTable
      .filter(r => r.seminarId === seminarId.trim.toInt && r.emailSent.map(es => es < fourteenDaysBeforeSeminar).getOrElse(true))
      .sortBy(_.registerTime.desc).result

    val result = db.run(query)
    result
  }

}
