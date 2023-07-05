package uk.gov.homeoffice.drt.routes


import akka.actor.typed.ActorSystem
import akka.http.scaladsl.model.{Multipart, StatusCodes}
import akka.http.scaladsl.server.Directives._
import akka.util.ByteString
import org.slf4j.{Logger, LoggerFactory}
import uk.gov.homeoffice.drt.uploadTraining.{S3Service, FeatureGuideService}

import scala.concurrent.{ExecutionContextExecutor, Future}
import scala.util.{Failure, Success}

object FeatureGuideRoutes {
  val log: Logger = LoggerFactory.getLogger(getClass)
  def featureGuideRoute(prefix: String)(implicit ec: ExecutionContextExecutor, system: ActorSystem[Nothing]) =
    pathPrefix(prefix) {
      path("uploadFeatureGuide") {
        post {
          entity(as[Multipart.FormData]) { _ =>
            formFields('title, 'markdownContent) { (title, markdownContent) =>
              fileUpload("webmFile") {
                case (metadata, byteSource) =>
                  val filename = metadata.fileName
                  FeatureGuideService.insertWebmDataTemplate(filename, title, markdownContent)
                  val responseF = S3Service.isFileLarge(byteSource).flatMap {
                    case true => S3Service.uploadFile(byteSource, filename)
                      .map(_ => complete(StatusCodes.OK, s"File $filename uploaded successfully"))
                    case false =>
                      val byteStringFuture: Future[ByteString] = byteSource.runFold(ByteString.empty)(_ ++ _)
                      byteStringFuture.map { byteString =>
                        S3Service.uploadFileSmallerFile(byteString, filename)
                      }.map(_ => complete(StatusCodes.OK, s"File $filename uploaded successfully"))
                  }

                  onComplete(responseF) {
                    case Success(result) => result
                    case Failure(ex) =>
                      log.error(s"Error while uploading", ex)
                      complete(StatusCodes.InternalServerError, ex.getMessage)
                  }
              }
            }
          }
        }
      }
    }
}
