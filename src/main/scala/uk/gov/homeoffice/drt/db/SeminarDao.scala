package uk.gov.homeoffice.drt.db

import org.joda.time.DateTime
import slick.lifted.ProvenShape
import slick.jdbc.PostgresProfile.api._

import java.sql.Timestamp
import java.time.{ZoneId, ZonedDateTime}
import java.time.format.DateTimeFormatter
import scala.concurrent.Future

case class SeminarRow(id: Option[Int],
                      title: String,
                      description: String,
                      startTime: Timestamp,
                      endTime: Timestamp,
                      published: Boolean,
                      meetingLink: Option[String],
                      latestUpdateTime: Timestamp)

class SeminarTable(tag: Tag) extends Table[SeminarRow](tag, "seminar") {
  def id: Rep[Option[Int]] = column[Option[Int]]("id", O.PrimaryKey, O.AutoInc)

  def title: Rep[String] = column[String]("title")

  def description: Rep[String] = column[String]("description")

  def startTime: Rep[Timestamp] = column[Timestamp]("start_time")

  def endTime: Rep[Timestamp] = column[Timestamp]("end_time")

  def published: Rep[Boolean] = column[Boolean]("published")

  def meetingLink: Rep[Option[String]] = column[Option[String]]("meeting_link")

  def latestUpdateTime: Rep[Timestamp] = column[Timestamp]("latest_update_time")

  def * : ProvenShape[SeminarRow] = (id, title, description, startTime, endTime, published, meetingLink, latestUpdateTime).mapTo[SeminarRow]
}

object SeminarDao {
  val dateFormatter: DateTimeFormatter = DateTimeFormatter.ofPattern("dd/MM/yyyy")

  val timeFormatter: DateTimeFormatter = DateTimeFormatter.ofPattern("HH:mm")

  val zonedUKDateTime: Timestamp => ZonedDateTime = timestamp => timestamp.toInstant.atZone(ZoneId.of("Europe/London"))

  def getUKStringDate(timestamp: Timestamp, formatter: DateTimeFormatter): String = zonedUKDateTime(timestamp).format(formatter)

  def getDate(startTime: Timestamp): String = getUKStringDate(startTime, dateFormatter)

  def getStartTime(startTime: Timestamp): String = getUKStringDate(startTime, timeFormatter)

  def getEndTime(endTime: Timestamp): String = getUKStringDate(endTime, timeFormatter)
}

case class SeminarDao(db: Database) {
  val seminarTable = TableQuery[SeminarTable]

  private def getCurrentTime = new Timestamp(new DateTime().getMillis)

  def updatePublishSeminar(seminarId: String, publish: Boolean) = {
    val query = seminarTable.filter(_.id === seminarId.trim.toInt).map(f => (f.published, f.latestUpdateTime))
      .update(publish, getCurrentTime)
    db.run(query)
  }

  def updateSeminar(seminarRow: SeminarRow): Future[Int] = seminarRow.id match {
    case Some(id) =>
      val query = seminarTable.filter(_.id === id).map(f => (f.title, f.description, f.startTime, f.endTime, f.meetingLink, f.latestUpdateTime))
        .update(seminarRow.title, seminarRow.description, seminarRow.startTime, seminarRow.endTime, seminarRow.meetingLink, getCurrentTime)
      db.run(query)
    case None => Future.successful(0)
  }

  def deleteSeminar(seminarId: String): Future[Int] = {
    val query = seminarTable.filter(_.id === seminarId.trim.toInt).delete
    db.run(query)
  }

  def getSeminarsWithInNotifyDate(): Future[Seq[SeminarRow]] = {
    val notifyDate = DateTime.now().withTimeAtStartOfDay.plusDays(15).getMillis
    val presentDate = DateTime.now().withTimeAtStartOfDay().minusDays(1).getMillis
    val query = seminarTable
      .filter(r => r.startTime > new Timestamp(presentDate) && r.startTime < new Timestamp(notifyDate))
      .sortBy(_.startTime).result
    val result = db.run(query)
    result
  }

  def getSeminars(listAll: Boolean): Future[Seq[SeminarRow]] = {
    val query = if (listAll) seminarTable.sortBy(_.startTime).result else seminarTable.filter(_.startTime > new Timestamp(DateTime.now().withTimeAtStartOfDay().minusDays(1).getMillis)).sortBy(_.startTime).result
    val result = db.run(query)
    result
  }

  def insertSeminarForm(title: String, description: String, startTime: Timestamp, endTime: Timestamp, meetingLink: Option[String]): Future[Int] = {
    val insertAction = seminarTable += SeminarRow(None, title, description, startTime, endTime, false, meetingLink, getCurrentTime)
    db.run(insertAction)
  }
}