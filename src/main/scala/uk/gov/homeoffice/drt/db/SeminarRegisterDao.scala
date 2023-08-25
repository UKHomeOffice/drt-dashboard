package uk.gov.homeoffice.drt.db

import slick.lifted.ProvenShape
import slick.jdbc.PostgresProfile.api._

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

  //  private def getCurrentTime = new Timestamp(new DateTime().getMillis)

  def removeUser(seminarId: String,email: String): Future[Int] = {
    println(s"removeUser: $seminarId, $email")
    val query = seminarsRegistrationTable.filter(r => r.seminarId === seminarId.trim.toInt && r.email === email.trim).delete
    db.run(query)
  }

  def getRegisterUsers(seminarId: String): Future[Seq[SeminarsRegistrationRow]] = {
    val query = seminarsRegistrationTable.filter(_.seminarId === seminarId.trim.toInt).sortBy(_.registerTime.desc).result
    val result = db.run(query)
    result
  }

}
