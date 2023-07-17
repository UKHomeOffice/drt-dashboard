package uk.gov.homeoffice.drt.db


import slick.jdbc.PostgresProfile.api._
import slick.lifted.ProvenShape
import upickle.default._

import java.sql.Timestamp

case class FeatureGuideViewRow(email: String, fileId: Int, viewTime: Timestamp)

class FeatureGuideViewTable(tag: Tag) extends Table[FeatureGuideViewRow](tag, "feature_guide_view") {
  def email: Rep[String] = column[String]("email")

  def featureGuideId: Rep[Int] = column[Int]("file_id")

  def viewTime: Rep[Timestamp] = column[Timestamp]("view_time")

  def * : ProvenShape[FeatureGuideViewRow] = (email, featureGuideId, viewTime).mapTo[FeatureGuideViewRow]

  val pk = primaryKey("feature_guide_view_pkey", (email, featureGuideId))

}

sealed trait FeatureGuideViewLike {

  import upickle.default.{ReadWriter, macroRW}

  implicit val timestampReader: ReadWriter[java.sql.Timestamp] = readwriter[String].bimap[java.sql.Timestamp](
    timestamp => timestamp.getTime.toString,
    str => new Timestamp(str.toLong)
  )
  implicit val rw: ReadWriter[FeatureGuideViewRow] = macroRW
}

case class FeatureGuideViewDao(db: Database) extends FeatureGuideViewLike {

  val userFeatureView = TableQuery[FeatureGuideViewTable]

  def deleteViewForFeature(featureId: String) = {
    val deleteAction = userFeatureView.filter(_.featureGuideId === featureId.toInt).delete
    db.run(deleteAction)
  }
}
