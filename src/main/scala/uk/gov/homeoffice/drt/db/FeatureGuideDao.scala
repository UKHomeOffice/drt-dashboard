package uk.gov.homeoffice.drt.db

import org.joda.time.DateTime
import slick.jdbc.PostgresProfile.api._
import slick.lifted.ProvenShape

import java.sql.Timestamp
import scala.concurrent.Future

case class FeatureGuideRow(id: Option[Int], uploadTime: Timestamp, fileName: Option[String], title: Option[String], markdownContent: String, published: Boolean)

class FeatureGuideTable(tag: Tag) extends Table[FeatureGuideRow](tag, "feature_guide") {
  def id: Rep[Option[Int]] = column[Option[Int]]("id", O.PrimaryKey, O.AutoInc)

  def uploadTime: Rep[Timestamp] = column[Timestamp]("upload_time")

  def fileName: Rep[Option[String]] = column[Option[String]]("file_name")

  def title: Rep[Option[String]] = column[Option[String]]("title")

  def markdownContent: Rep[String] = column[String]("markdown_content")

  def published: Rep[Boolean] = column[Boolean]("published")

  def * : ProvenShape[FeatureGuideRow] = (id, uploadTime, fileName, title, markdownContent, published).mapTo[FeatureGuideRow]
}


object FeatureGuideDao {
  val FeatureGuideTable = TableQuery[FeatureGuideTable]

  private def getCurrentTime = new Timestamp(new DateTime().getMillis)

  def updatePublishFeatureGuide(featureId: String, publish: Boolean) = {
    val query = FeatureGuideTable.filter(_.id === featureId.trim.toInt).map(f => (f.published, f.uploadTime))
      .update(publish, getCurrentTime)
    AppDatabase.db.run(query)
  }

  def updateFeatureGuide(featureId: String, title: String, markdownContent: String) = {
    val query = FeatureGuideTable.filter(_.id === featureId.trim.toInt).map(f => (f.title, f.markdownContent, f.uploadTime))
      .update((Some(title), markdownContent, getCurrentTime))
    AppDatabase.db.run(query)
  }

  def deleteFeatureGuide(featureId: String): Future[Int] = {
    val query = FeatureGuideTable.filter(_.id === featureId.trim.toInt).delete
    AppDatabase.db.run(query)
  }

  def getFeatureGuides(): Future[Seq[FeatureGuideRow]] = {
    val query = FeatureGuideTable.result
    val result = AppDatabase.db.run(query)
    result
  }

  def insertWebmDataTemplate(fileName: String, title: String, markdownContent: String): Unit = {
    val insertAction = FeatureGuideTable += FeatureGuideRow(None, getCurrentTime, Some(fileName), Some(title), markdownContent, false)
    AppDatabase.db.run(insertAction)
  }
}
