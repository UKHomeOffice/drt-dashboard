package uk.gov.homeoffice.drt.routes

import akka.http.scaladsl.model.{ContentType, MediaTypes}
import akka.http.scaladsl.testkit.ScalatestRouteTest
import org.scalatest.matchers.should.Matchers
import org.scalatest.wordspec.AnyWordSpec
import uk.gov.homeoffice.drt.MockHttpClient
import uk.gov.homeoffice.drt.ports.PortCode
import org.apache.poi.xssf.usermodel.XSSFWorkbook
import java.io.ByteArrayInputStream

class ExportConfigRoutesSpec extends AnyWordSpec with Matchers with ScalatestRouteTest {

    def mockHttpClient(csvContent: String): MockHttpClient = MockHttpClient(() => csvContent)

    "Request test port config" should {
        "e-gate schedule data" in {
            Get("/export-config") ~>
              ExportConfigRoutes(mockHttpClient(
                  s"""E-gates schedule
                     |Terminal,Effective from,OpenGates per bank
                     |T1,2020-01-01T0000,bank-1  10/10
                     |""".stripMargin), Seq(PortCode("TEST"))) ~>
              check {
                  contentType should ===(ContentType(MediaTypes.`application/vnd.openxmlformats-officedocument.spreadsheetml.sheet`))
                  val responseBytes = responseAs[Array[Byte]]
                  val inputStream = new ByteArrayInputStream(responseBytes)
                  val workbook = new XSSFWorkbook(inputStream)
                  workbook.getNumberOfSheets should be > 0
                  val eGatesScheduleSheet = workbook.getSheet("TEST")
                  eGatesScheduleSheet.getRow(0).getCell(0).getStringCellValue should be("E-gates schedule")
                  eGatesScheduleSheet.getRow(1).getCell(0).getStringCellValue should be("Terminal")
                  eGatesScheduleSheet.getRow(1).getCell(1).getStringCellValue should be("Effective from")
                  eGatesScheduleSheet.getRow(1).getCell(2).getStringCellValue should be("OpenGates per bank")
                  eGatesScheduleSheet.getRow(2).getCell(0).getStringCellValue should be("T1")
                  eGatesScheduleSheet.getRow(2).getCell(1).getStringCellValue should be("2020-01-01T0000")
                  eGatesScheduleSheet.getRow(2).getCell(2).getStringCellValue should be("bank-1  10/10")
              }
        }

        "Queue SLAs" in {
            Get("/export-config") ~>
              ExportConfigRoutes(mockHttpClient(
                  s"""Queue SLAs
                     |Effective from,Queue,Minutes
                     |2014-09-01T0000,EeaDesk,25
                     |2014-09-01T0000,EGate,5
                     |2014-09-01T0000,NonEeaDesk,45
                     |""".stripMargin), Seq(PortCode("TEST"))) ~>
              check {
                  contentType should ===(ContentType(MediaTypes.`application/vnd.openxmlformats-officedocument.spreadsheetml.sheet`))
                  val responseBytes = responseAs[Array[Byte]]
                  val inputStream = new ByteArrayInputStream(responseBytes)
                  val workbook = new XSSFWorkbook(inputStream)
                  workbook.getNumberOfSheets should be > 0
                  val queueSLAsSheet = workbook.getSheet("TEST")
                  queueSLAsSheet.getRow(0).getCell(0).getStringCellValue should be("Queue SLAs")
                  queueSLAsSheet.getRow(1).getCell(0).getStringCellValue should be("Effective from")
                  queueSLAsSheet.getRow(1).getCell(1).getStringCellValue should be("Queue")
                  queueSLAsSheet.getRow(1).getCell(2).getStringCellValue should be("Minutes")
                  queueSLAsSheet.getRow(2).getCell(0).getStringCellValue should be("2014-09-01T0000")
                  queueSLAsSheet.getRow(2).getCell(1).getStringCellValue should be("EeaDesk")
                  queueSLAsSheet.getRow(2).getCell(2).getStringCellValue should be("25")
                  queueSLAsSheet.getRow(3).getCell(0).getStringCellValue should be("2014-09-01T0000")
                  queueSLAsSheet.getRow(3).getCell(1).getStringCellValue should be("EGate")
                  queueSLAsSheet.getRow(3).getCell(2).getStringCellValue should be("5")
                  queueSLAsSheet.getRow(4).getCell(0).getStringCellValue should be("2014-09-01T0000")
                  queueSLAsSheet.getRow(4).getCell(1).getStringCellValue should be("NonEeaDesk")
                  queueSLAsSheet.getRow(4).getCell(2).getStringCellValue should be("45")
              }
        }

        "Desks and Egates" in {
            Get("/export-config") ~>
              ExportConfigRoutes(mockHttpClient(
                  s"""Desks and Egates
                     |22 desks
                     |30 egates in 3 banks: 10 10 10
                     |"""
                    .stripMargin), Seq(PortCode("TEST"))) ~>
              check {
                  contentType should ===(ContentType(MediaTypes.`application/vnd.openxmlformats-officedocument.spreadsheetml.sheet`))
                  val responseBytes = responseAs[Array[Byte]]
                  val inputStream = new ByteArrayInputStream(responseBytes)
                  val workbook = new XSSFWorkbook(inputStream)
                  workbook.getNumberOfSheets should be > 0
                  val queueSLAsSheet = workbook.getSheet("TEST")
                  queueSLAsSheet.getRow(0).getCell(0).getStringCellValue should be("Desks and Egates")
                  queueSLAsSheet.getRow(1).getCell(0).getStringCellValue should be("22 desks")
                  queueSLAsSheet.getRow(2).getCell(0).getStringCellValue should be("30 egates in 3 banks: 10 10 10")
              }
        }

        "Processing Times" in {
            Get("/export-config") ~>
              ExportConfigRoutes(mockHttpClient(
                  s"""Processing Times
                     |Passenger Type & Queue,Seconds
                     |B5J+ National to e-Gates,45
                     |EEA Machine Readable to e-Gates,45
                     |GBR National to e-Gates,45
                     |B5J+ National to EEA,50
                     |B5J+ Child to EEA,50
                     |EEA Child to EEA,33
                     |EEA Machine Readable to EEA,33
                     |EEA Non-Machine Readable to EEA,33
                     |GBR National to EEA,26
                     |GBR National Child to EEA,26
                     |Non-Visa National to Non-EEA,75
                     |Visa National to Non-EEA,89
                     |""".stripMargin), Seq(PortCode("TEST"))) ~>
              check {
                  contentType should ===(ContentType(MediaTypes.`application/vnd.openxmlformats-officedocument.spreadsheetml.sheet`))
                  val responseBytes = responseAs[Array[Byte]]
                  val inputStream = new ByteArrayInputStream(responseBytes)
                  val workbook = new XSSFWorkbook(inputStream)
                  workbook.getNumberOfSheets should be > 0
                  val queueSLAsSheet = workbook.getSheet("TEST")
                  queueSLAsSheet.getRow(0).getCell(0).getStringCellValue should be("Processing Times")
                  queueSLAsSheet.getRow(1).getCell(0).getStringCellValue should be("Passenger Type & Queue")
                  queueSLAsSheet.getRow(1).getCell(1).getStringCellValue should be("Seconds")
                  queueSLAsSheet.getRow(2).getCell(0).getStringCellValue should be("B5J+ National to e-Gates")
                  queueSLAsSheet.getRow(2).getCell(1).getStringCellValue should be("45")
                  queueSLAsSheet.getRow(3).getCell(0).getStringCellValue should be("EEA Machine Readable to e-Gates")
                  queueSLAsSheet.getRow(3).getCell(1).getStringCellValue should be("45")
                  queueSLAsSheet.getRow(4).getCell(0).getStringCellValue should be("GBR National to e-Gates")
                  queueSLAsSheet.getRow(4).getCell(1).getStringCellValue should be("45")
                  queueSLAsSheet.getRow(5).getCell(0).getStringCellValue should be("B5J+ National to EEA")
                  queueSLAsSheet.getRow(5).getCell(1).getStringCellValue should be("50")
                  queueSLAsSheet.getRow(6).getCell(0).getStringCellValue should be("B5J+ Child to EEA")
                  queueSLAsSheet.getRow(6).getCell(1).getStringCellValue should be("50")
                  queueSLAsSheet.getRow(7).getCell(0).getStringCellValue should be("EEA Child to EEA")
                  queueSLAsSheet.getRow(7).getCell(1).getStringCellValue should be("33")
                  queueSLAsSheet.getRow(8).getCell(0).getStringCellValue should be("EEA Machine Readable to EEA")
                  queueSLAsSheet.getRow(8).getCell(1).getStringCellValue should be("33")
                  queueSLAsSheet.getRow(9).getCell(0).getStringCellValue should be("EEA Non-Machine Readable to EEA")
                  queueSLAsSheet.getRow(9).getCell(1).getStringCellValue should be("33")
                  queueSLAsSheet.getRow(10).getCell(0).getStringCellValue should be("GBR National to EEA")
                  queueSLAsSheet.getRow(10).getCell(1).getStringCellValue should be("26")
                  queueSLAsSheet.getRow(11).getCell(0).getStringCellValue should be("GBR National Child to EEA")
                  queueSLAsSheet.getRow(11).getCell(1).getStringCellValue should be("26")
                  queueSLAsSheet.getRow(12).getCell(0).getStringCellValue should be("Non-Visa National to Non-EEA")
                  queueSLAsSheet.getRow(12).getCell(1).getStringCellValue should be("75")
                  queueSLAsSheet.getRow(13).getCell(0).getStringCellValue should be("Visa National to Non-EEA")
                  queueSLAsSheet.getRow(13).getCell(1).getStringCellValue should be("89")
              }
        }
        "Passenger Queue Allocation" in {
            Get("/export-config") ~>
              ExportConfigRoutes(mockHttpClient(
                  s"""Passenger Queue Allocation
                     |Passenger Type,Queue,Allocation
                     |B5J+ National,e-Gates,70%
                     |B5J+ National,EEA,30%
                     |B5J+ Child,EEA,100%
                     |EEA Child,EEA,100%
                     |EEA Machine Readable,e-Gates,80%
                     |EEA Machine Readable,EEA,20%
                     |EEA Non-Machine Readable,EEA,100%
                     |GBR National,e-Gates,80%
                     |GBR National,EEA,20%
                     |GBR National Child,EEA,100%
                     |Non-Visa National,Non-EEA,100%
                     |Visa National,Non-EEA,100%
                     |""".stripMargin), Seq(PortCode("TEST"))) ~>
              check {
                  contentType should ===(ContentType(MediaTypes.`application/vnd.openxmlformats-officedocument.spreadsheetml.sheet`))
                  val responseBytes = responseAs[Array[Byte]]
                  val inputStream = new ByteArrayInputStream(responseBytes)
                  val workbook = new XSSFWorkbook(inputStream)
                  workbook.getNumberOfSheets should be > 0
                  val queueSLAsSheet = workbook.getSheet("TEST")
                  queueSLAsSheet.getRow(0).getCell(0).getStringCellValue should be("Passenger Queue Allocation")
                  queueSLAsSheet.getRow(1).getCell(0).getStringCellValue should be("Passenger Type")
                  queueSLAsSheet.getRow(1).getCell(1).getStringCellValue should be("Queue")
                  queueSLAsSheet.getRow(1).getCell(2).getStringCellValue should be("Allocation")
                  queueSLAsSheet.getRow(2).getCell(0).getStringCellValue should be("B5J+ National")
                  queueSLAsSheet.getRow(2).getCell(1).getStringCellValue should be("e-Gates")
                  queueSLAsSheet.getRow(2).getCell(2).getStringCellValue should be("70%")
                  queueSLAsSheet.getRow(3).getCell(0).getStringCellValue should be("B5J+ National")
                  queueSLAsSheet.getRow(3).getCell(1).getStringCellValue should be("EEA")
                  queueSLAsSheet.getRow(3).getCell(2).getStringCellValue should be("30%")
                  queueSLAsSheet.getRow(4).getCell(0).getStringCellValue should be("B5J+ Child")
                  queueSLAsSheet.getRow(4).getCell(1).getStringCellValue should be("EEA")
                  queueSLAsSheet.getRow(4).getCell(2).getStringCellValue should be("100%")
                  queueSLAsSheet.getRow(5).getCell(0).getStringCellValue should be("EEA Child")
                  queueSLAsSheet.getRow(5).getCell(1).getStringCellValue should be("EEA")
                  queueSLAsSheet.getRow(5).getCell(2).getStringCellValue should be("100%")
                  queueSLAsSheet.getRow(6).getCell(0).getStringCellValue should be("EEA Machine Readable")
                  queueSLAsSheet.getRow(6).getCell(1).getStringCellValue should be("e-Gates")
                  queueSLAsSheet.getRow(6).getCell(2).getStringCellValue should be("80%")
                  queueSLAsSheet.getRow(7).getCell(0).getStringCellValue should be("EEA Machine Readable")
                  queueSLAsSheet.getRow(7).getCell(1).getStringCellValue should be("EEA")
                  queueSLAsSheet.getRow(7).getCell(2).getStringCellValue should be("20%")
                  queueSLAsSheet.getRow(8).getCell(0).getStringCellValue should be("EEA Non-Machine Readable")
                  queueSLAsSheet.getRow(8).getCell(1).getStringCellValue should be("EEA")
                  queueSLAsSheet.getRow(8).getCell(2).getStringCellValue should be("100%")
                  queueSLAsSheet.getRow(9).getCell(0).getStringCellValue should be("GBR National")
                  queueSLAsSheet.getRow(9).getCell(1).getStringCellValue should be("e-Gates")
                  queueSLAsSheet.getRow(9).getCell(2).getStringCellValue should be("80%")
                  queueSLAsSheet.getRow(10).getCell(0).getStringCellValue should be("GBR National")
                  queueSLAsSheet.getRow(10).getCell(1).getStringCellValue should be("EEA")
                  queueSLAsSheet.getRow(10).getCell(2).getStringCellValue should be("20%")
                  queueSLAsSheet.getRow(11).getCell(0).getStringCellValue should be("GBR National Child")
                  queueSLAsSheet.getRow(11).getCell(1).getStringCellValue should be("EEA")
                  queueSLAsSheet.getRow(11).getCell(2).getStringCellValue should be("100%")
                  queueSLAsSheet.getRow(12).getCell(0).getStringCellValue should be("Non-Visa National")
                  queueSLAsSheet.getRow(12).getCell(1).getStringCellValue should be("Non-EEA")
                  queueSLAsSheet.getRow(12).getCell(2).getStringCellValue should be("100%")
                  queueSLAsSheet.getRow(13).getCell(0).getStringCellValue should be("Visa National")
                  queueSLAsSheet.getRow(13).getCell(1).getStringCellValue should be("Non-EEA")
                  queueSLAsSheet.getRow(13).getCell(2).getStringCellValue should be("100%")
              }
        }

        "Walktimes" in  {
           Get("/export-config") ~>
              ExportConfigRoutes(mockHttpClient(
                  s"""Walktimes
                      |Gate,Walk time in minutes
                      |Default,10
                      |""".stripMargin), Seq(PortCode("TEST"))) ~>
              check {
                  contentType should ===(ContentType(MediaTypes.`application/vnd.openxmlformats-officedocument.spreadsheetml.sheet`))
                  val responseBytes = responseAs[Array[Byte]]
                  val inputStream = new ByteArrayInputStream(responseBytes)
                  val workbook = new XSSFWorkbook(inputStream)
                  workbook.getNumberOfSheets should be > 0
                  val queueSLAsSheet = workbook.getSheet("TEST")
                  queueSLAsSheet.getRow(0).getCell(0).getStringCellValue should be("Walktimes")
                  queueSLAsSheet.getRow(1).getCell(0).getStringCellValue should be("Gate")
                  queueSLAsSheet.getRow(1).getCell(1).getStringCellValue should be("Walk time in minutes")
                  queueSLAsSheet.getRow(2).getCell(0).getStringCellValue should be("Default")
                  queueSLAsSheet.getRow(2).getCell(1).getStringCellValue should be("10")
              }
        }
    }
}
