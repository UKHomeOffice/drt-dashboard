package uk.gov.homeoffice.drt.routes


import akka.actor.typed.ActorSystem
import akka.http.scaladsl.marshallers.sprayjson.SprayJsonSupport._
import akka.http.scaladsl.model.{Multipart, StatusCodes}
import akka.http.scaladsl.server.Directives._
import akka.http.scaladsl.server.StandardRoute
import akka.util.ByteString
import org.slf4j.{Logger, LoggerFactory}
import spray.json.{DefaultJsonProtocol, JsArray, JsString, JsValue, JsonFormat, RootJsonFormat, deserializationError, enrichAny}
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

  implicit val featureGuideRowFormatParser: RootJsonFormat[FeatureGuideRow] = jsonFormat5(FeatureGuideRow)
}

object FeatureGuideRoutes extends FeatureGuideJsonFormats {
  val log: Logger = LoggerFactory.getLogger(getClass)

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
        } ~ getFeatureGuides() ~ deleteFeature())
    }
}
