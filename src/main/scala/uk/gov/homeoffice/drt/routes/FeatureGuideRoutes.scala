package uk.gov.homeoffice.drt.routes


import akka.actor.typed.ActorSystem
import akka.http.scaladsl.marshallers.sprayjson.SprayJsonSupport._
import akka.http.scaladsl.model.HttpEntity.ChunkStreamPart
import akka.http.scaladsl.model.headers.RawHeader
import akka.http.scaladsl.model._
import akka.http.scaladsl.server.Directives._
import akka.http.scaladsl.server.StandardRoute
import akka.stream.IOResult
import akka.stream.scaladsl.Source
import akka.util.ByteString
import org.slf4j.{Logger, LoggerFactory}
import spray.json.{DefaultJsonProtocol, JsString, JsValue, JsonFormat, RootJsonFormat, deserializationError, enrichAny}
import uk.gov.homeoffice.drt.uploadTraining.{FeatureGuideRow, FeatureGuideService, S3Service}

import java.sql.Timestamp
import scala.concurrent.{ExecutionContextExecutor, Future}
import scala.util.{Failure, Success}

trait FeatureGuideJsonFormats extends DefaultJsonProtocol {
  implicit object TimestampFormat extends JsonFormat[Timestamp] {
    override def write(obj: Timestamp): JsValue = JsString(obj.toString)

    override def read(json: JsValue): Timestamp = json match {
      case JsString(rawDate) => {
        try {
          Timestamp.valueOf(rawDate)
        } catch {
          case iae: IllegalArgumentException => deserializationError("Invalid date format")
          case _: Exception => None
        }
      } match {
        case dateTime: Timestamp => dateTime
        case None => deserializationError(s"Couldn't parse date time, got $rawDate")
      }
    }
  }

  implicit val featureGuideRowFormatParser: RootJsonFormat[FeatureGuideRow] = jsonFormat6(FeatureGuideRow)
}

object FeatureGuideRoutes extends FeatureGuideJsonFormats {
  val log: Logger = LoggerFactory.getLogger(getClass)

  def getFeatureVideoFile()(implicit ec: ExecutionContextExecutor, system: ActorSystem[Nothing]) =
    path("getFeatureVideos" / Segment) { filename =>
      get {
        val responseStreamF: Future[Source[ByteString, Future[IOResult]]] = S3Service.getVideoFile(filename)

        val fileEntityF: Future[ResponseEntity] = responseStreamF.map(responseStream =>
          HttpEntity.Chunked(
            contentType = ContentTypes.`application/octet-stream`,
            chunks = responseStream.map(ChunkStreamPart.apply(_: ByteString))))

        val contentDispositionHeader: HttpHeader =
          RawHeader("Content-Disposition", s"attachment; filename=$filename")

        val responseF = fileEntityF.map { fileEntity => complete(HttpResponse(entity = fileEntity, headers = List(contentDispositionHeader))) }

        onComplete(responseF) {
          case Success(result) => result
          case Failure(ex) =>
            log.error(s"Error while uploading", ex)
            complete(StatusCodes.InternalServerError, ex.getMessage)
        }
      }
    }

  def getFeatureGuides()(implicit ec: ExecutionContextExecutor, system: ActorSystem[Nothing]) = path("getFeatureGuides") {
    val responseF: Future[StandardRoute] = FeatureGuideService.getFeatureGuides().map { featureGuides =>
      val json: JsValue = featureGuides.toJson
      complete(StatusCodes.OK, json)
    }

    onComplete(responseF) {
      case Success(result) => result
      case Failure(ex) =>
        log.error(s"Error while uploading", ex)
        complete(StatusCodes.InternalServerError, ex.getMessage)
    }
  }

  def updateFeatureGuide()(implicit ec: ExecutionContextExecutor, system: ActorSystem[Nothing]) =
    path("updateFeatureGuide" / Segment) { featureId =>
      post {
        entity(as[Multipart.FormData]) { _ =>
          formFields('title, 'markdownContent) { (title, markdownContent) =>
            val responseF = FeatureGuideService.updateFeatureGuide(featureId, title, markdownContent)
              .map(_ => complete(StatusCodes.OK, s"Feature $featureId is updated successfully"))

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

  def publishFeatureGuide()(implicit ec: ExecutionContextExecutor, system: ActorSystem[Nothing]) =
    path("publishFeatureGuide" / Segment / Segment) { (publishAction, featureId) =>
      post {
        val responseF = FeatureGuideService.updatePublishFeatureGuide(featureId, publishAction == "publish")
          .map(_ => complete(StatusCodes.OK, s"Feature $featureId is published successfully"))

        onComplete(responseF) {
          case Success(result) => result
          case Failure(ex) =>
            log.error(s"Error while uploading", ex)
            complete(StatusCodes.InternalServerError, ex.getMessage)
        }
      }
    }

  def deleteFeature()(implicit ec: ExecutionContextExecutor, system: ActorSystem[Nothing]) =
    path("removeFeatureGuide" / Segment) { featureId =>
      delete {
        val responseF: Future[StandardRoute] = FeatureGuideService.deleteFeatureGuide(featureId).map { featureGuides =>
          val json: JsValue = featureGuides.toJson
          complete(StatusCodes.OK, json)
        }

        onComplete(responseF) {
          case Success(result) => result
          case Failure(ex) =>
            log.error(s"Error while deleting feature $featureId", ex)
            complete(StatusCodes.InternalServerError, ex.getMessage)
        }
      }
    }

  def apply(prefix: String)(implicit ec: ExecutionContextExecutor, system: ActorSystem[Nothing]) =
    pathPrefix(prefix) {
      concat(
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
        } ~ getFeatureGuides() ~ deleteFeature() ~ updateFeatureGuide() ~ getFeatureVideoFile() ~ publishFeatureGuide())
    }
}
