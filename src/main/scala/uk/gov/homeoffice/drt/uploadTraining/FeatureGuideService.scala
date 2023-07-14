package uk.gov.homeoffice.drt.uploadTraining

import uk.gov.homeoffice.drt.db.{FeatureGuideDao, FeatureGuideRow, FeatureGuideViewDao}

import scala.concurrent.Future


object FeatureGuideService {
  def updatePublishFeatureGuide(featureId: String, publish: Boolean) = {
    FeatureGuideDao.updatePublishFeatureGuide(featureId, publish)
  }

  def updateFeatureGuide(featureId: String, title: String, markdownContent: String) = {
    FeatureGuideDao.updateFeatureGuide(featureId, title, markdownContent)
    FeatureGuideViewDao.deleteViewForFeature(featureId)
  }

  def deleteFeatureGuide(featureId: String): Future[Int] = {
    FeatureGuideDao.deleteFeatureGuide(featureId)
  }

  def getFeatureGuides(): Future[Seq[FeatureGuideRow]] = {
    FeatureGuideDao.getFeatureGuides()
  }

  def insertWebmDataTemplate(fileName: String, title: String, markdownContent: String): Unit = {
    FeatureGuideDao.insertWebmDataTemplate(fileName, title, markdownContent)
  }
}
