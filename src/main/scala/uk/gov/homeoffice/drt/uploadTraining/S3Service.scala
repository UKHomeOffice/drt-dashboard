package uk.gov.homeoffice.drt.uploadTraining

import akka.actor.typed.ActorSystem
import akka.stream.scaladsl.{Sink, Source}
import akka.util.ByteString
import com.typesafe.config.ConfigFactory
import org.slf4j.{Logger, LoggerFactory}
import software.amazon.awssdk.auth.credentials.{AwsBasicCredentials, StaticCredentialsProvider}
import software.amazon.awssdk.core.async.AsyncRequestBody
import software.amazon.awssdk.regions.Region
import software.amazon.awssdk.services.s3.S3AsyncClient
import software.amazon.awssdk.services.s3.model._

import scala.compat.java8.FutureConverters._
import scala.concurrent.ExecutionContext.Implicits.global
import scala.concurrent.{ExecutionContextExecutor, Future}

object S3Service {

  val log: Logger = LoggerFactory.getLogger(getClass)

  val config = ConfigFactory.load

  def objectKey(filename: String) = s"$prefixFolder/$filename"

  val accessKey = config.getString("s3.drt-data.credentials.access_key_id")
  val secretKey = config.getString("s3.drt-data.credentials.secret_key")
  val bucketName = config.getString("s3.drt-data.bucket-name")
  val prefixFolder = config.getString("s3.drt-data.prefix-folder")

  val credentialsProvider = StaticCredentialsProvider.create(AwsBasicCredentials.create(accessKey, secretKey))

  val s3Client: S3AsyncClient = S3AsyncClient.builder()
    .region(Region.EU_WEST_2)
    .credentialsProvider(credentialsProvider)
    .build()


  def putObjectRequest(fileName: String) = PutObjectRequest.builder()
    .bucket(bucketName)
    .key(objectKey(fileName))
    .build()


  def createMultipartUploadRequest(filename: String) = CreateMultipartUploadRequest.builder()
    .bucket(bucketName)
    .key(objectKey(filename))
    .build()

  def uploadIdFuture(filename: String): Future[String] = s3Client.createMultipartUpload(createMultipartUploadRequest(filename))
    .toScala
    .map(_.uploadId())

  def isFileLarge(source : Source[ByteString, Any])(implicit ec: ExecutionContextExecutor, system: ActorSystem[Nothing]): Future[Boolean] = {
    val threshold: Int = 5 * 1024 * 1024
    source.runFold(0L)((acc, byteString) => acc + byteString.size).map { fileSize =>
      if (fileSize > threshold) true else false
    }
  }

  def uploadFileSmallerFile(byteString: ByteString, filename: String)(implicit ec: ExecutionContextExecutor, system: ActorSystem[Nothing]): Future[Unit] = {
    s3Client.putObject(putObjectRequest(filename), AsyncRequestBody.fromByteBuffer(byteString.asByteBuffer)).toScala
      .map(response => log.info(s"File $filename uploaded successfully. ETag: ${response.eTag()}"))
  }

  private def uploadPart(partNumber: Int, data: ByteString, uploadId: String, filename: String): Future[CompletedPart] = {
    val partSize = data.length
    val byteBuffer = data.asByteBuffer
    val uploadPartRequest: UploadPartRequest = UploadPartRequest.builder()
      .bucket(bucketName)
      .key(objectKey(filename))
      .partNumber(partNumber)
      .uploadId(uploadId)
      .contentLength(partSize)
      .build()

    s3Client.uploadPart(uploadPartRequest, AsyncRequestBody.fromByteBuffer(byteBuffer))
      .toScala
      .map(uploadPartResponse => CompletedPart.builder()
        .partNumber(partNumber)
        .eTag(uploadPartResponse.eTag())
        .build())
  }


  def uploadFile(source: Source[ByteString, Any], filename: String)(implicit ec: ExecutionContextExecutor, system: ActorSystem[Nothing]) = {
    val parts: Source[(Int, ByteString), Any] = source.zipWithIndex.map { case (data, index) => (index.toInt + 1, data) }
    val uploadIdF: Future[String] = uploadIdFuture(filename)

    val completedPartsFuture: Future[Seq[CompletedPart]] = uploadIdF.flatMap { uploadId =>
      parts.mapAsyncUnordered(parallelism = 1) { case (partNumber, data) =>
        uploadPart(partNumber, data, uploadId, filename)
      }.runWith(Sink.seq)
    }


    completedPartsFuture.flatMap { completedParts =>
      uploadIdF.map { uploadId =>

        val sortedCompletedParts = completedParts.sortBy(_.partNumber())

        val completeMultipartUploadRequest = CompleteMultipartUploadRequest.builder()
          .bucket(bucketName)
          .key(objectKey(filename))
          .uploadId(uploadId)
          .multipartUpload(CompletedMultipartUpload.builder().parts(sortedCompletedParts: _*).build())
          .build()

        s3Client.completeMultipartUpload(completeMultipartUploadRequest)
          .whenComplete { (response, exception) =>
            if (response != null) {
              log.info(s"File $filename uploaded successfully. ETag: ${response.eTag()}")
            } else {
              log.info(s"Failed to upload file. Exception: $exception")
            }
          }
      }

    }
  }


}
