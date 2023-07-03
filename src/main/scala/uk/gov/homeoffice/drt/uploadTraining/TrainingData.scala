package uk.gov.homeoffice.drt.uploadTraining

import slick.jdbc.PostgresProfile.api._
import slick.lifted.ProvenShape
import uk.gov.homeoffice.drt.db.AppDatabase

import java.sql.Timestamp


case class TrainingDataTemplate(id: Option[Int], uploadTime: Timestamp, fileName: Option[String], title: Option[String], markdownContent: String)

class TrainingDataTemplateTable(tag: Tag) extends Table[TrainingDataTemplate](tag, "training_data_template") {
  def id: Rep[Option[Int]] = column[Option[Int]]("id", O.PrimaryKey, O.AutoInc)

  def uploadTime: Rep[Timestamp] = column[Timestamp]("upload_time")

  def fileName: Rep[Option[String]] = column[Option[String]]("file_name")

  def title: Rep[Option[String]] = column[Option[String]]("title")

  def markdownContent: Rep[String] = column[String]("markdown_content")

  def * : ProvenShape[TrainingDataTemplate] = (id, uploadTime, fileName, title, markdownContent).mapTo[TrainingDataTemplate]
}


object TrainingData {
  val trainingDataTemplates = TableQuery[TrainingDataTemplateTable]

  def insertWebmDataTemplate(fileName: String, title: String, markdownContent: String): Unit = {
    val insertAction = trainingDataTemplates += TrainingDataTemplate(None, new Timestamp(System.currentTimeMillis()), Some(fileName), Some(title), markdownContent)
    AppDatabase.db.run(insertAction)
  }

}
