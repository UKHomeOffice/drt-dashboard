package uk.gov.homeoffice.drt.routes

import akka.actor.ActorSystem
import akka.http.scaladsl.model._
import akka.http.scaladsl.model.headers.{ContentDispositionTypes, `Content-Disposition`}
import akka.http.scaladsl.server.Directives._
import akka.http.scaladsl.server.Route
import akka.http.scaladsl.unmarshalling.Unmarshal
import akka.stream.Materializer
import akka.stream.scaladsl.Source
import akka.util.ByteString
import org.apache.poi.xssf.usermodel.XSSFWorkbook
import uk.gov.homeoffice.drt.HttpClient
import uk.gov.homeoffice.drt.ports.PortCode
import uk.gov.homeoffice.drt.time.SDate
import java.io.ByteArrayOutputStream
import scala.concurrent.ExecutionContext

object ExportConfigRoutes {

  def getMergePortConfig(httpClient: HttpClient, enabledPorts: Seq[PortCode])(implicit ec: ExecutionContext, mat: Materializer): Route = get {
    implicit val system: ActorSystem = mat.system

    val endpoints = enabledPorts.map { portCode =>
      (portCode.iata, s"http://${portCode.iata.toLowerCase}:9000/export/port-config")
    }


    def generateExcelContent(): Source[ByteString, _] = {
      val workbook = new XSSFWorkbook()

      def writeToWorkbook(sheetName: String, data: Seq[String]): Unit = {
        val sheet = workbook.createSheet(sheetName)
        data.zipWithIndex.foreach { case (value, index) =>
          val row = sheet.createRow(index)
          value.split(",").zipWithIndex.foreach { case (cellValue, cellIndex) =>
            row.createCell(cellIndex).setCellValue(cellValue)
          }
        }
      }

      val processData = Source(endpoints).mapAsync(10) { case (portCode, uriString) =>
        val request = HttpRequest(uri = Uri(uriString))
        httpClient.send(request).flatMap { response =>
          Unmarshal(response.entity).to[String].map { data =>
            val lines = data.split("\n")
            (portCode, lines.toSeq)
          }
        }.recover { case e: Throwable =>
          (portCode, Seq(s"Error while requesting export for $uriString, ${e.getMessage}"))
        }
      }.runForeach { case (portCode, lines) =>
        writeToWorkbook(portCode, lines)
      }

      Source.future(processData.map { _ =>
        val byteStream = new ByteArrayOutputStream()
        workbook.write(byteStream)
        workbook.close()
        ByteString(byteStream.toByteArray)
      })
    }

    val excelSource: Source[ByteString, _] = generateExcelContent()
    val excelContentType = ContentType.parse("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet").getOrElse(ContentTypes.`application/octet-stream`)


    val contentDispositionHeader = `Content-Disposition`(ContentDispositionTypes.attachment, Map("filename" -> s"port-config-${SDate.now()}.xlsx"))

    complete(HttpResponse(
      status = StatusCodes.OK,
      headers = List(contentDispositionHeader),
      entity = HttpEntity(excelContentType, excelSource)
    ))
  }

  def apply(httpClient: HttpClient, enabledPorts: Seq[PortCode])(implicit ec: ExecutionContext, mat: Materializer): Route =
    pathPrefix("export-config") {
      concat(
        getMergePortConfig(httpClient, enabledPorts)
      )
    }
}
