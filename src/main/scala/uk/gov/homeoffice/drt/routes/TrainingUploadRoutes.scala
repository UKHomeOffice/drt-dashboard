package uk.gov.homeoffice.drt.routes


import akka.actor.typed.ActorSystem
import akka.http.scaladsl.model.{Multipart, StatusCodes}
import akka.http.scaladsl.server.Directives._
import akka.util.ByteString
import org.slf4j.{Logger, LoggerFactory}
import uk.gov.homeoffice.drt.uploadTraining.{S3Service, TrainingData}

import scala.concurrent.{ExecutionContextExecutor, Future}
import scala.util.{Failure, Success}

object TrainingUploadRoutes {
  val log: Logger = LoggerFactory.getLogger(getClass)

  def trainingUploadRoute(prefix: String)(implicit ec: ExecutionContextExecutor, system: ActorSystem[Nothing]) =
    pathPrefix(prefix) {
      path("upload") {
        post {
          entity(as[Multipart.FormData]) { _ =>
            formFields('title, 'markdownContent) { (title, markdownContent) =>
              fileUpload("webmFile") {
                case (metadata, byteSource) =>
                  val filename = metadata.fileName
                  TrainingData.insertWebmDataTemplate(filename, title, markdownContent)
                  val byteStringFuture: Future[ByteString] = byteSource.runFold(ByteString.empty)(_ ++ _)
                  val responseF = byteStringFuture.map { byteString =>
                    S3Service.uploadFileSmallerFile(byteString, filename)
                  }.map(_ => complete(StatusCodes.OK, s"File $filename uploaded successfully"))
                  onComplete(responseF) {
                    case Success(result) => result
                    case Failure(ex) =>
                      log.error(s"Error while uploading", ex)
                      complete(StatusCodes.InternalServerError, ex.getMessage) // Handle the failure case
                  }
              }
            }
          }
        }

      }
    }
}
