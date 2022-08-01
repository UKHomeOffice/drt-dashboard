package uk.gov.homeoffice.drt.rccu

import akka.actor.testkit.typed.scaladsl.ActorTestKit
import akka.actor.typed.ActorSystem
import akka.http.scaladsl.model._
import akka.stream.{ IOResult, Materializer }
import org.joda.time.{ DateTime, DateTimeZone }
import org.specs2.mutable.Specification
import org.specs2.specification.AfterEach
import uk.gov.homeoffice.drt.HttpClient
import uk.gov.homeoffice.drt.ports.PortRegion
import uk.gov.homeoffice.drt.ports.PortRegion.Heathrow
import uk.gov.homeoffice.drt.routes.ExportRoutes

import java.io.File
import scala.concurrent.duration._
import scala.concurrent.{ Await, ExecutionContextExecutor, Future }

class ExportCsvServiceSpec extends Specification with AfterEach {

  val testKit: ActorTestKit = ActorTestKit()

  implicit val sys: ActorSystem[Nothing] = testKit.system
  implicit val ec: ExecutionContextExecutor = sys.executionContext
  val exportCsvService = new ExportCsvService(MockHttpClient)

  val testFolder = "./temp/test/"

  override def after: Unit = { new File(testFolder).listFiles.map(_.delete()) }

  "Give date I get string in expected format" >> {
    val currentDateString = ExportRoutes.stringToDate("2022-07-22")
    val dateTime: DateTime = new DateTime(2022, 7, 22, 0, 0, 0, 0, DateTimeZone.forID("Europe/London"))
    currentDateString mustEqual dateTime
  }

  "Given port code LHR I get uri for csv export for all terminal" >> {
    val expectedResult = List(
      "http://lhr:9000/export/arrivals/2022-07-22/2022-07-22/T1",
      "http://lhr:9000/export/arrivals/2022-07-22/2022-07-22/T2",
      "http://lhr:9000/export/arrivals/2022-07-22/2022-07-22/T3",
      "http://lhr:9000/export/arrivals/2022-07-22/2022-07-22/T4")
    val expectedUri = "http://lhr:9000/export/arrivals/2022-07-22/2022-07-24/T1"
    val uri = exportCsvService.getUri("LHR", "2022-07-22", "2022-07-24", "T1")
    uri mustEqual expectedUri
  }

  "Given port get the csv export for port and terminal" >> {
    val portResponses: Set[PortResponse] = Await.result(Future.sequence(exportCsvService.getPortResponseForRegionPorts("2022-07-22", "2022-07-22", Heathrow)), 1.seconds)
    val resultCsv: Set[String] = portResponses.map(r => Await.result(r.httpResponse.entity.dataBytes.runReduce(_ ++ _), 1.seconds).utf8String)
    resultCsv mustEqual Set(csv)
  }

  "Given port get the csv export for port and terminal in List for Heathrow" >> {
    val fileName = ExportRoutes.makeFileName("test", "2022-07-22", "2022-07-23", "Heathrow")
    val portResponses = exportCsvService.getPortResponseForRegionPorts("2022-07-22", "2022-07-23", Heathrow)
    val a = Future.sequence(portResponses.map(_.map(exportCsvService.getCsvDataRegionPort(_, s"$testFolder/$fileName", false)).flatten))
    val resultCsvs: Set[IOResult] = Await.result(a, 1.seconds)
    resultCsvs.size mustEqual 1
  }

  "Given a string I get PortRegion" >> {
    val region = ExportRoutes.getPortRegion("Heathrow")
    PortRegion.Heathrow mustEqual region
  }

  object MockHttpClient extends HttpClient {
    def send(httpRequest: HttpRequest)(implicit executionContext: ExecutionContextExecutor, mat: Materializer): Future[HttpResponse] = {
      Future(HttpResponse(StatusCodes.OK, entity = HttpEntity(ContentTypes.`text/csv(UTF-8)`, csv)))(executionContext)
    }
  }

  lazy val mapCSVForLHRTerminal: Seq[Map[String, String]] = exportCsvService.getTerminal("LHR").flatMap(mapCsv(_))

  val mapCsv: String => List[Map[String, String]] = terminal => List(
    Map(
      "API EEA" -> "",
      "Invalid API" -> "",
      "API Actual - B5J+ Child to EEA" -> "0.0",
      "API Actual - GBR National to EEA" -> "0.0",
      "Terminal Average Non-EEA" -> "",
      "Ages" -> "",
      "API Actual - Visa National to Fast Track" -> "0.0",
      "Terminal Average Fast Track" -> "",
      "Est Arrival" -> "2022-07-22 08:01",
      "ICAO" -> "EI0152",
      "Historical Non-EEA" -> "",
      "API Actual - B5J+ National to EEA" -> "0.0",
      "Terminal" -> terminal,
      "Historical EEA" -> "",
      "Total Pax" -> "94",
      "Terminal Average e-Gates" -> "",
      "Origin" -> "DUB",
      "Act Chox" -> "2022-07-22 08:08",
      "Historical e-Gates" -> "",
      "Minutes off scheduled" -> "1",
      "API Actual - EEA Child to EEA" -> "0.0",
      "API Actual - Non-Visa National to Non-EEA" -> "0.0",
      "Scheduled" -> "2022-07-22 08:00",
      "API Actual - B5J+ National to e-Gates" -> "0.0",
      "Gate/Stand" -> "/221R",
      "API Actual - EEA Machine Readable to e-Gates" -> "0.0",
      "Region" -> "Heathrow",
      "Est PCP" -> "2022-07-22 08:14",
      "API Fast Track" -> "",
      "Port" -> "LHR",
      "API Non-EEA" -> "",
      "API Actual - GBR National to e-Gates" -> "0.0",
      "Terminal Average EEA" -> "",
      "Est Chox" -> "2022-07-22 08:09",
      "Historical Fast Track" -> "",
      "API Actual - GBR National Child to EEA" -> "0.0",
      "API Actual - EEA Non-Machine Readable to EEA" -> "0.0",
      "Nationalities" -> "",
      "Act Arrival" -> "2022-07-22 08:01",
      "PCP Pax" -> "-",
      "API e-Gates" -> "",
      "IATA" -> "EI0152",
      "API Actual - Visa National to Non-EEA" -> "0.0",
      "API Actual - Non-Visa National to Fast Track" -> "0.0",
      "Status" -> "On Chocks",
      "API Actual - EEA Machine Readable to EEA" -> "0.0"),
    Map(
      "API EEA" -> "",
      "Invalid API" -> "",
      "API Actual - B5J+ Child to EEA" -> "0.0",
      "API Actual - GBR National to EEA" -> "0.0",
      "Terminal Average Non-EEA" -> "",
      "Ages" -> "",
      "API Actual - Visa National to Fast Track" -> "0.0",
      "Terminal Average Fast Track" -> "",
      "Est Arrival" -> "2022-07-22 07:56",
      "ICAO" -> "SQ0306",
      "Historical Non-EEA" -> "",
      "API Actual - B5J+ National to EEA" -> "0.0",
      "Terminal" -> terminal,
      "Historical EEA" -> "",
      "Total Pax" -> "245",
      "Terminal Average e-Gates" -> "",
      "Origin" -> "SIN",
      "Act Chox" -> "2022-07-22 08:03",
      "Historical e-Gates" -> "",
      "Minutes off scheduled" -> "11",
      "API Actual - EEA Child to EEA" -> "0.0",
      "API Actual - Non-Visa National to Non-EEA" -> "0.0",
      "Scheduled" -> "2022-07-22 07:45",
      "API Actual - B5J+ National to e-Gates" -> "0.0",
      "Gate/Stand" -> "/243",
      "API Actual - EEA Machine Readable to e-Gates" -> "0.0",
      "Region" -> "Heathrow",
      "Est PCP" -> "2022-07-22 08:15",
      "API Fast Track" -> "",
      "Port" -> "LHR",
      "API Non-EEA" -> "",
      "API Actual - GBR National to e-Gates" -> "0.0",
      "Terminal Average EEA" -> "",
      "Est Chox" -> "2022-07-22 08:03",
      "Historical Fast Track" -> "",
      "API Actual - GBR National Child to EEA" -> "0.0",
      "API Actual - EEA Non-Machine Readable to EEA" -> "0.0",
      "Nationalities" -> "",
      "Act Arrival" -> "2022-07-22 07:56",
      "PCP Pax" -> "215",
      "API e-Gates" -> "",
      "IATA" -> "SQ0306",
      "API Actual - Visa National to Non-EEA" -> "0.0",
      "API Actual - Non-Visa National to Fast Track" -> "0.0",
      "Status" -> "On Chocks",
      "API Actual - EEA Machine Readable to EEA" -> "0.0"))

  val amendRegionPortTerminalcsv =
    """Region,Port,Terminal,IATA,ICAO,Origin,Gate/Stand,Status,Scheduled,Est Arrival,Act Arrival,Est Chox,Act Chox,Minutes off scheduled,Est PCP,Total Pax,PCP Pax,Invalid API,API e-Gates,API EEA,API Non-EEA,API Fast Track,Historical e-Gates,Historical EEA,Historical Non-EEA,Historical Fast Track,Terminal Average e-Gates,Terminal Average EEA,Terminal Average Non-EEA,Terminal Average Fast Track,API Actual - EEA Machine Readable to e-Gates,API Actual - EEA Machine Readable to EEA,API Actual - EEA Non-Machine Readable to EEA,API Actual - EEA Child to EEA,API Actual - GBR National to e-Gates,API Actual - GBR National to EEA,API Actual - GBR National Child to EEA,API Actual - B5J+ National to e-Gates,API Actual - B5J+ National to EEA,API Actual - B5J+ Child to EEA,API Actual - Visa National to Non-EEA,API Actual - Non-Visa National to Non-EEA,API Actual - Visa National to Fast Track,API Actual - Non-Visa National to Fast Track,Nationalities,Ages
      |Heathrow,LHR,T1,EI0152,EI0152,DUB,/221R,On Chocks,2022-07-22 08:00,2022-07-22 08:01,2022-07-22 08:01,2022-07-22 08:09,2022-07-22 08:08,1,2022-07-22 08:14,94,-,,,,,,,,,,,,,,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,"",""
      |Heathrow,LHR,T1,SQ0306,SQ0306,SIN,/243,On Chocks,2022-07-22 07:45,2022-07-22 07:56,2022-07-22 07:56,2022-07-22 08:03,2022-07-22 08:03,11,2022-07-22 08:15,245,215,,,,,,,,,,,,,,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,"",""
      |Heathrow,LHR,T2,EI0152,EI0152,DUB,/221R,On Chocks,2022-07-22 08:00,2022-07-22 08:01,2022-07-22 08:01,2022-07-22 08:09,2022-07-22 08:08,1,2022-07-22 08:14,94,-,,,,,,,,,,,,,,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,"",""
      |Heathrow,LHR,T2,SQ0306,SQ0306,SIN,/243,On Chocks,2022-07-22 07:45,2022-07-22 07:56,2022-07-22 07:56,2022-07-22 08:03,2022-07-22 08:03,11,2022-07-22 08:15,245,215,,,,,,,,,,,,,,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,"",""
      |Heathrow,LHR,T3,EI0152,EI0152,DUB,/221R,On Chocks,2022-07-22 08:00,2022-07-22 08:01,2022-07-22 08:01,2022-07-22 08:09,2022-07-22 08:08,1,2022-07-22 08:14,94,-,,,,,,,,,,,,,,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,"",""
      |Heathrow,LHR,T3,SQ0306,SQ0306,SIN,/243,On Chocks,2022-07-22 07:45,2022-07-22 07:56,2022-07-22 07:56,2022-07-22 08:03,2022-07-22 08:03,11,2022-07-22 08:15,245,215,,,,,,,,,,,,,,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,"",""
      |Heathrow,LHR,T4,EI0152,EI0152,DUB,/221R,On Chocks,2022-07-22 08:00,2022-07-22 08:01,2022-07-22 08:01,2022-07-22 08:09,2022-07-22 08:08,1,2022-07-22 08:14,94,-,,,,,,,,,,,,,,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,"",""
      |Heathrow,LHR,T4,SQ0306,SQ0306,SIN,/243,On Chocks,2022-07-22 07:45,2022-07-22 07:56,2022-07-22 07:56,2022-07-22 08:03,2022-07-22 08:03,11,2022-07-22 08:15,245,215,,,,,,,,,,,,,,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,"",""
      |""".stripMargin

  val csv =
    """IATA,ICAO,Origin,Gate/Stand,Status,Scheduled,Est Arrival,Act Arrival,Est Chox,Act Chox,Minutes off scheduled,Est PCP,Total Pax,PCP Pax,Invalid API,API e-Gates,API EEA,API Non-EEA,API Fast Track,Historical e-Gates,Historical EEA,Historical Non-EEA,Historical Fast Track,Terminal Average e-Gates,Terminal Average EEA,Terminal Average Non-EEA,Terminal Average Fast Track,API Actual - EEA Machine Readable to e-Gates,API Actual - EEA Machine Readable to EEA,API Actual - EEA Non-Machine Readable to EEA,API Actual - EEA Child to EEA,API Actual - GBR National to e-Gates,API Actual - GBR National to EEA,API Actual - GBR National Child to EEA,API Actual - B5J+ National to e-Gates,API Actual - B5J+ National to EEA,API Actual - B5J+ Child to EEA,API Actual - Visa National to Non-EEA,API Actual - Non-Visa National to Non-EEA,API Actual - Visa National to Fast Track,API Actual - Non-Visa National to Fast Track,Nationalities,Ages
      |EI0152,EI0152,DUB,/221R,On Chocks,2022-07-22 08:00,2022-07-22 08:01,2022-07-22 08:01,2022-07-22 08:09,2022-07-22 08:08,1,2022-07-22 08:14,94,-,,,,,,,,,,,,,,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,"",""
      |SQ0306,SQ0306,SIN,/243,On Chocks,2022-07-22 07:45,2022-07-22 07:56,2022-07-22 07:56,2022-07-22 08:03,2022-07-22 08:03,11,2022-07-22 08:15,245,215,,,,,,,,,,,,,,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,"",""
      |""".stripMargin

  val csv1 =
    """IATA,ICAO,Origin,Gate/Stand,Status,Scheduled,Est Arrival,Act Arrival,Est Chox,Act Chox,Minutes off scheduled,Est PCP,Total Pax,PCP Pax,Invalid API,API e-Gates,API EEA,API Non-EEA,API Fast Track,Historical e-Gates,Historical EEA,Historical Non-EEA,Historical Fast Track,Terminal Average e-Gates,Terminal Average EEA,Terminal Average Non-EEA,Terminal Average Fast Track,API Actual - EEA Machine Readable to e-Gates,API Actual - EEA Machine Readable to EEA,API Actual - EEA Non-Machine Readable to EEA,API Actual - EEA Child to EEA,API Actual - GBR National to e-Gates,API Actual - GBR National to EEA,API Actual - GBR National Child to EEA,API Actual - B5J+ National to e-Gates,API Actual - B5J+ National to EEA,API Actual - B5J+ Child to EEA,API Actual - Visa National to Non-EEA,API Actual - Non-Visa National to Non-EEA,API Actual - Visa National to Fast Track,API Actual - Non-Visa National to Fast Track,Nationalities,Ages
      |EI0152,EI0152,DUB,/221R,On Chocks,2022-07-22 08:00,2022-07-22 08:01,2022-07-22 08:01,2022-07-22 08:09,2022-07-22 08:08,1,2022-07-22 08:14,94,-,,,,,,,,,,,,,,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,"",""
      |SQ0306,SQ0306,SIN,/243,On Chocks,2022-07-22 07:45,2022-07-22 07:56,2022-07-22 07:56,2022-07-22 08:03,2022-07-22 08:03,11,2022-07-22 08:15,245,215,,,,,,,,,,,,,,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,"",""
      |EW2462,EW2462,STR,/224,On Chocks,2022-07-22 08:25,2022-07-22 08:07,2022-07-22 08:07,2022-07-22 08:15,2022-07-22 08:12,-18,2022-07-22 08:20,121,113,,,,,,,,,,,,,,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,"",""
      |OS0451,OS0451,VIE,/218R,On Chocks,2022-07-22 08:20,2022-07-22 08:03,2022-07-22 08:03,2022-07-22 08:13,2022-07-22 08:10,-17,2022-07-22 08:28,148,114,,,,,,,,,,,,,,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,"",""
      |LX0352,LX0352,GVA,/218L,On Chocks,2022-07-22 08:15,2022-07-22 08:07,2022-07-22 08:07,2022-07-22 08:16,2022-07-22 08:15,-8,2022-07-22 08:33,139,101,,,,,,,,,,,,,,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,"",""
      |EI0710,EI0710,ORK,/221L,On Chocks,2022-07-22 08:40,2022-07-22 08:22,2022-07-22 08:22,2022-07-22 08:30,2022-07-22 08:31,-18,2022-07-22 08:37,100,-,,,,,,,,,,,,,,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,"",""
      |UA0904,UA0904,EWR,/231,On Chocks,2022-07-22 08:10,2022-07-22 08:21,2022-07-22 08:21,2022-07-22 08:26,2022-07-22 08:25,11,2022-07-22 08:40,145,139,,,,,,,,,,,,,,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,"",""
      |UA0931,UA0931,ORD,/246,On Chocks,2022-07-22 08:30,2022-07-22 08:25,2022-07-22 08:25,2022-07-22 08:32,2022-07-22 08:42,-5,2022-07-22 08:53,155,151,,,,,,,,,,,,,,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,"",""
      |LH0900,LH0900,FRA,/217,On Chocks,2022-07-22 08:40,2022-07-22 08:48,2022-07-22 08:48,2022-07-22 08:57,2022-07-22 09:03,8,2022-07-22 09:07,153,133,,,,,,,,,,,,,,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,"",""
      |EI0380,EI0380,SNN,/226,On Chocks,2022-07-22 09:05,2022-07-22 08:49,2022-07-22 08:49,2022-07-22 08:57,2022-07-22 09:00,-16,2022-07-22 09:10,138,-,,,,,,,,,,,,,,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,"",""
      |SK0501,SK0501,CPH,/225,On Chocks,2022-07-22 08:55,2022-07-22 08:50,2022-07-22 08:50,2022-07-22 08:58,2022-07-22 09:01,-5,2022-07-22 09:10,88,71,,,,,,,,,,,,,,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,"",""
      |EI0154,EI0154,DUB,/221R,On Chocks,2022-07-22 09:05,2022-07-22 08:41,2022-07-22 08:41,2022-07-22 08:49,2022-07-22 09:15,-24,2022-07-22 09:21,125,-,,,,,,,,,,,,,,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,"",""
      |SK0803,SK0803,OSL,/223,On Chocks,2022-07-22 09:20,2022-07-22 09:06,2022-07-22 09:06,2022-07-22 09:14,2022-07-22 09:19,-14,2022-07-22 09:27,64,46,,,,,,,,,,,,,,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,"",""
      |LO0281,LO0281,WAW,/216,On Chocks,2022-07-22 09:25,2022-07-22 09:09,2022-07-22 09:09,2022-07-22 09:19,2022-07-22 09:27,-16,2022-07-22 09:32,84,80,,,,,,,,,,,,,,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,"",""
      |UA0016,UA0016,EWR,/232,On Chocks,2022-07-22 09:20,2022-07-22 09:20,2022-07-22 09:20,2022-07-22 09:27,2022-07-22 09:24,0,2022-07-22 09:39,133,133,,,,,,,,,,,,,,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,"",""
      |UA0027,UA0027,DEN,/249,On Chocks,2022-07-22 09:40,2022-07-22 09:25,2022-07-22 09:25,2022-07-22 09:31,2022-07-22 09:30,-15,2022-07-22 09:45,239,226,,,,,,,,,,,,,,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,"",""
      |LH0902,LH0902,FRA,/219,On Chocks,2022-07-22 09:40,2022-07-22 09:27,2022-07-22 09:27,2022-07-22 09:36,2022-07-22 09:38,-13,2022-07-22 09:45,112,103,,,,,,,,,,,,,,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,"",""
      |SK0525,SK0525,ARN,/224,On Chocks,2022-07-22 09:35,2022-07-22 09:34,2022-07-22 09:34,2022-07-22 09:42,2022-07-22 09:41,-1,2022-07-22 09:49,67,58,,,,,,,,,,,,,,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,"",""
      |AC0850,AC0850,YYC,/239,On Chocks,2022-07-22 10:00,2022-07-22 09:37,2022-07-22 09:37,2022-07-22 09:47,2022-07-22 09:46,-23,2022-07-22 09:59,243,208,,,,,,,,,,,,,,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,"",""
      |UA0940,UA0940,EWR,/237,On Chocks,2022-07-22 10:10,2022-07-22 09:40,2022-07-22 09:40,2022-07-22 09:51,2022-07-22 09:47,-30,2022-07-22 10:05,146,145,,,,,,,,,,,,,,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,"",""
      |UA0924,UA0924,IAD,/244,On Chocks,2022-07-22 10:30,2022-07-22 09:59,2022-07-22 09:59,2022-07-22 10:06,2022-07-22 10:06,-31,2022-07-22 10:17,165,162,,,,,,,,,,,,,,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,"",""
      |LH2472,LH2472,MUC,/217,On Chocks,2022-07-22 09:45,2022-07-22 09:48,2022-07-22 09:48,2022-07-22 09:57,2022-07-22 10:13,3,2022-07-22 10:17,148,132,,,,,,,,,,,,,,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,"",""
      |SN2093,SN2093,BRU,/220,Expected,2022-07-22 10:15,2022-07-22 10:15,,,,,2022-07-22 10:27,157,157,,,,,,,,,,,,,,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,"",""
      |UA0948,UA0948,SFO,/231,On Chocks,2022-07-22 10:25,2022-07-22 10:12,2022-07-22 10:12,2022-07-22 10:17,2022-07-22 10:16,-13,2022-07-22 10:31,236,222,,,,,,,,,,,,,,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,"",""
      |AC0856,AC0856,YYZ,/243,Landed,2022-07-22 08:35,2022-07-22 10:14,2022-07-22 10:14,2022-07-22 10:21,,99,2022-07-22 10:33,350,326,,,,,,,,,,,,,,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,"",""
      |AC0866,AC0866,YUL,/238,Delayed,2022-07-22 09:35,2022-07-22 10:22,,2022-07-22 10:32,,,2022-07-22 10:44,232,204,,,,,,,,,,,,,,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,"",""
      |BE1222,BE1222,AMS,/,Expected,2022-07-22 10:35,2022-07-22 10:45,,2022-07-22 10:53,,,2022-07-22 11:11,68,68,,,,,,,,,,,,,,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,"",""
      |AI0171,AI0171,AMD,/,Expected,2022-07-22 11:30,2022-07-22 10:50,,,,,2022-07-22 11:13,240,232,,,,,,,,,,,,,,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,"",""
      |A30600,A30600,ATH,/,Expected,2022-07-22 11:15,2022-07-22 11:00,,2022-07-22 11:08,,,2022-07-22 11:26,161,150,,,,,,,,,,,,,,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,"",""
      |UA0005,UA0005,IAH,/,Expected,2022-07-22 11:35,2022-07-22 11:01,,2022-07-22 11:09,,,2022-07-22 11:27,256,222,,,,,,,,,,,,,,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,"",""
      |LX0318,LX0318,ZRH,/,Expected,2022-07-22 11:25,2022-07-22 11:06,,2022-07-22 11:14,,,2022-07-22 11:32,119,115,,,,,,,,,,,,,,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,"",""
      |AI0145,AI0145,GOI,/,Delayed,2022-07-22 10:15,2022-07-22 11:07,,2022-07-22 11:15,,,2022-07-22 11:33,218,218,,,,,,,,,,,,,,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,"",""
      |TK1979,TK1979,IST,/,Delayed,2022-07-22 09:50,2022-07-22 10:48,,2022-07-22 10:56,,,2022-07-22 11:35,349,333,,,,,,,,,,,,,,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,"",""
      |TP1356,TP1356,LIS,/,Delayed,2022-07-22 11:00,2022-07-22 11:25,,2022-07-22 11:33,,,2022-07-22 11:51,139,131,,,,,,,,,,,,,,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,"",""
      |UA0923,UA0923,LAX,/,Expected,2022-07-22 11:45,2022-07-22 11:26,,2022-07-22 11:34,,,2022-07-22 11:52,227,207,,,,,,,,,,,,,,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,"",""
      |AC0860,AC0860,YVR,/,Expected,2022-07-22 11:50,2022-07-22 11:27,,2022-07-22 11:35,,,2022-07-22 11:53,268,232,,,,,,,,,,,,,,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,"",""
      |LH0904,LH0904,FRA,/,Delayed,2022-07-22 10:40,2022-07-22 11:29,,2022-07-22 11:37,,,2022-07-22 11:55,150,150,,,,,,,,,,,,,,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,"",""
      |FI0450,FI0450,KEF,/,Expected,2022-07-22 11:55,2022-07-22 11:41,,2022-07-22 11:49,,,2022-07-22 12:07,168,161,,,,,,,,,,,,,,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,"",""
      |AC0858,AC0858,YYZ,/,Expected,2022-07-22 11:50,2022-07-22 11:44,,,,,2022-07-22 12:07,296,282,,,,,,,,,,,,,,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,"",""
      |UA0938,UA0938,ORD,/,Delayed,2022-07-22 11:20,2022-07-22 11:46,,2022-07-22 11:54,,,2022-07-22 12:12,137,132,,,,,,,,,,,,,,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,"",""
      |UA0262,UA0262,DEN,/,Expected,2022-07-22 12:20,2022-07-22 12:04,,,,,2022-07-22 12:27,228,170,,,,,,,,,,,,,,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,"",""
      |UA0146,UA0146,EWR,/,Delayed,2022-07-22 11:05,2022-07-22 12:08,,,,,2022-07-22 12:31,154,151,,,,,,,,,,,,,,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,"",""
      |EI0162,EI0162,DUB,/,Expected,2022-07-22 12:40,2022-07-22 12:40,,,,,2022-07-22 13:03,160,-,,,,,,,,,,,,,,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,"",""
      |LH0906,LH0906,FRA,/,Expected,2022-07-22 12:40,2022-07-22 12:40,,,,,2022-07-22 13:03,150,150,,,,,,,,,,,,,,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,"",""
      |TP1352,TP1352,LIS,/,Expected,2022-07-22 12:45,2022-07-22 12:45,,,,,2022-07-22 13:08,149,149,,,,,,,,,,,,,,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,"",""
      |SK0531,SK0531,ARN,/,Expected,2022-07-22 12:55,2022-07-22 12:55,,,,,2022-07-22 13:18,157,157,,,,,,,,,,,,,,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,"",""
      |AC0862,AC0862,YVR,/,Expected,2022-07-22 13:25,2022-07-22 12:56,,,,,2022-07-22 13:19,328,328,,,,,,,,,,,,,,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,"",""
      |LX0332,LX0332,ZRH,/,Expected,2022-07-22 13:00,2022-07-22 13:00,,,,,2022-07-22 13:23,126,126,,,,,,,,,,,,,,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,"",""
      |GQ0700,GQ0700,ATH,/,Expected,2022-07-22 13:05,2022-07-22 13:05,,,,,2022-07-22 13:28,162,162,,,,,,,,,,,,,,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,"",""
      |EI0712,EI0712,ORK,/,Expected,2022-07-22 13:05,2022-07-22 13:05,,,,,2022-07-22 13:28,151,-,,,,,,,,,,,,,,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,"",""
      |UA0024,UA0024,BOS,/,Delayed,2022-07-22 10:35,2022-07-22 13:15,,,,,2022-07-22 13:38,117,112,,,,,,,,,,,,,,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,"",""
      |EI0164,EI0164,DUB,/,Expected,2022-07-22 13:25,2022-07-22 13:25,,,,,2022-07-22 13:48,151,-,,,,,,,,,,,,,,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,"",""
      |AH2054,AH2054,ALG,/,Expected,2022-07-22 13:30,2022-07-22 13:30,,,,,2022-07-22 13:53,,0,,,,,,,,,,,,,,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,"",""
      |MS0777,MS0777,CAI,/,Expected,2022-07-22 13:35,2022-07-22 13:17,,,,,2022-07-22 14:01,270,259,,,,,,,,,,,,,,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,"",""
      |LX0354,LX0354,GVA,/,Expected,2022-07-22 13:40,2022-07-22 13:40,,,,,2022-07-22 14:03,123,109,,,,,,,,,,,,,,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,"",""
      |UA0930,UA0930,SFO,/,Expected,2022-07-22 14:10,2022-07-22 13:45,,,,,2022-07-22 14:08,239,206,,,,,,,,,,,,,,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,"",""
      |EI0160,EI0160,DUB,/,Expected,2022-07-22 13:55,2022-07-22 13:55,,,,,2022-07-22 14:18,151,-,,,,,,,,,,,,,,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,"",""
      |LM0675,LM0675,IOM,/,Expected,2022-07-22 13:55,2022-07-22 13:55,,,,,2022-07-22 14:18,63,-,,,,,,,,,,,,,,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,"",""
      |EW0464,EW0464,CGN,/,Expected,2022-07-22 14:05,2022-07-22 14:05,,,,,2022-07-22 14:28,157,157,,,,,,,,,,,,,,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,"",""
      |EW7462,EW7462,HAM,/,Expected,2022-07-22 14:10,2022-07-22 14:10,,,,,2022-07-22 14:33,157,157,,,,,,,,,,,,,,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,"",""
      |OS0461,OS0461,VIE,/,Expected,2022-07-22 14:20,2022-07-22 14:20,,,,,2022-07-22 14:43,151,151,,,,,,,,,,,,,,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,"",""
      |SK0805,SK0805,OSL,/,Expected,2022-07-22 14:35,2022-07-22 14:35,,,,,2022-07-22 14:58,157,157,,,,,,,,,,,,,,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,"",""
      |LH0908,LH0908,FRA,/,Expected,2022-07-22 14:40,2022-07-22 14:40,,,,,2022-07-22 15:03,150,150,,,,,,,,,,,,,,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,"",""
      |TK1985,TK1985,IST,/,Expected,2022-07-22 14:55,2022-07-22 14:55,,,,,2022-07-22 15:39,265,286,,,,,,,,,,,,,,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,"",""
      |SQ0308,SQ0308,SIN,/,Expected,2022-07-22 15:40,2022-07-22 15:26,,,,,2022-07-22 15:49,246,215,,,,,,,,,,,,,,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,"",""
      |A30602,A30602,ATH,/,Expected,2022-07-22 15:30,2022-07-22 15:30,,,,,2022-07-22 15:53,191,191,,,,,,,,,,,,,,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,"",""
      |LH0910,LH0910,FRA,/,Expected,2022-07-22 15:40,2022-07-22 15:40,,,,,2022-07-22 16:03,150,150,,,,,,,,,,,,,,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,"",""
      |NH0211,NH0211,HND,/,Expected,2022-07-22 16:25,2022-07-22 15:43,,,,,2022-07-22 16:06,106,101,,,,,,,,,,,,,,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,"",""
      |LH2476,LH2476,MUC,/,Expected,2022-07-22 15:45,2022-07-22 15:45,,,,,2022-07-22 16:08,150,150,,,,,,,,,,,,,,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,"",""
      |AV0120,AV0120,BOG,/,Expected,2022-07-22 15:35,2022-07-22 15:35,,,,,2022-07-22 16:19,245,229,,,,,,,,,,,,,,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,"",""
      |EI0168,EI0168,DUB,/,Expected,2022-07-22 16:00,2022-07-22 16:00,,,,,2022-07-22 16:23,151,-,,,,,,,,,,,,,,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,"",""
      |SK0505,SK0505,CPH,/,Expected,2022-07-22 16:00,2022-07-22 16:00,,,,,2022-07-22 16:23,157,157,,,,,,,,,,,,,,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,"",""
      |CI0081,CI0081,TPE,/,Expected,2022-07-22 16:30,2022-07-22 16:19,,,,,2022-07-22 16:42,70,64,,,,,,,,,,,,,,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,"",""
      |LX0324,LX0324,ZRH,/,Expected,2022-07-22 16:20,2022-07-22 16:20,,,,,2022-07-22 16:43,126,126,,,,,,,,,,,,,,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,"",""
      |EW9464,EW9464,DUS,/,Expected,2022-07-22 16:25,2022-07-22 16:25,,,,,2022-07-22 16:48,157,157,,,,,,,,,,,,,,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,"",""
      |LX0348,LX0348,GVA,/,Expected,2022-07-22 16:35,2022-07-22 16:35,,,,,2022-07-22 16:58,126,126,,,,,,,,,,,,,,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,"",""
      |LH0914,LH0914,FRA,/,Expected,2022-07-22 16:40,2022-07-22 16:40,,,,,2022-07-22 17:03,0,150,,,,,,,,,,,,,,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,"",""
      |SK0527,SK0527,ARN,/,Expected,2022-07-22 17:00,2022-07-22 17:00,,,,,2022-07-22 17:23,146,157,,,,,,,,,,,,,,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,"",""
      |SN2095,SN2095,BRU,/,Expected,2022-07-22 17:05,2022-07-22 17:05,,,,,2022-07-22 17:28,157,157,,,,,,,,,,,,,,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,"",""
      |LH2478,LH2478,MUC,/,Expected,2022-07-22 17:05,2022-07-22 17:05,,,,,2022-07-22 17:28,150,150,,,,,,,,,,,,,,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,"",""
      |TK1971,TK1971,IST,/,Expected,2022-07-22 16:45,2022-07-22 16:45,,,,,2022-07-22 17:29,304,304,,,,,,,,,,,,,,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,"",""
      |EI0174,EI0174,DUB,/,Expected,2022-07-22 17:20,2022-07-22 17:20,,,,,2022-07-22 17:43,151,-,,,,,,,,,,,,,,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,"",""
      |LO0279,LO0279,WAW,/,Expected,2022-07-22 17:20,2022-07-22 17:20,,,,,2022-07-22 17:43,162,162,,,,,,,,,,,,,,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,"",""
      |EI0722,EI0722,ORK,/,Expected,2022-07-22 17:35,2022-07-22 17:35,,,,,2022-07-22 17:58,151,-,,,,,,,,,,,,,,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,"",""
      |TP1350,TP1350,LIS,/,Expected,2022-07-22 17:45,2022-07-22 17:45,,,,,2022-07-22 18:08,151,151,,,,,,,,,,,,,,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,"",""
      |EW2464,EW2464,STR,/,Expected,2022-07-22 18:05,2022-07-22 18:05,,,,,2022-07-22 18:28,157,157,,,,,,,,,,,,,,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,"",""
      |WF0356,WF0356,BGO,/,Expected,2022-07-22 18:20,2022-07-22 18:20,,,,,2022-07-22 18:43,96,96,,,,,,,,,,,,,,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,"",""
      |LX0356,LX0356,GVA,/,Expected,2022-07-22 18:30,2022-07-22 18:30,,,,,2022-07-22 18:53,126,126,,,,,,,,,,,,,,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,"",""
      |SK0811,SK0811,OSL,/,Expected,2022-07-22 18:30,2022-07-22 18:30,,,,,2022-07-22 18:53,157,157,,,,,,,,,,,,,,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,"",""
      |LH2486,LH2486,MUC,/,Expected,2022-07-22 18:30,2022-07-22 18:30,,,,,2022-07-22 18:53,150,150,,,,,,,,,,,,,,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,"",""
      |EI0386,EI0386,SNN,/,Expected,2022-07-22 18:40,2022-07-22 18:40,,,,,2022-07-22 19:03,151,-,,,,,,,,,,,,,,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,"",""
      |OS0455,OS0455,VIE,/,Expected,2022-07-22 18:40,2022-07-22 18:40,,,,,2022-07-22 19:03,151,174,,,,,,,,,,,,,,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,"",""
      |LH0918,LH0918,FRA,/,Expected,2022-07-22 18:40,2022-07-22 18:40,,,,,2022-07-22 19:03,150,150,,,,,,,,,,,,,,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,"",""
      |TP1364,TP1364,LIS,/,Expected,2022-07-22 18:50,2022-07-22 18:50,,,,,2022-07-22 19:13,151,151,,,,,,,,,,,,,,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,"",""
      |SK4627,SK4627,SVG,/,Expected,2022-07-22 18:50,2022-07-22 18:50,,,,,2022-07-22 19:13,157,157,,,,,,,,,,,,,,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,"",""
      |EW9462,EW9462,DUS,/,Expected,2022-07-22 18:50,2022-07-22 18:50,,,,,2022-07-22 19:13,157,157,,,,,,,,,,,,,,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,"",""
      |AI0149,AI0149,COK,/,Expected,2022-07-22 19:00,2022-07-22 19:00,,,,,2022-07-22 19:23,223,223,,,,,,,,,,,,,,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,"",""
      |EW0468,EW0468,CGN,/,Expected,2022-07-22 19:05,2022-07-22 19:05,,,,,2022-07-22 19:28,157,157,,,,,,,,,,,,,,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,"",""
      |BR0067,BR0067,TPE,/,Expected,2022-07-22 19:25,2022-07-22 19:09,,,,,2022-07-22 19:32,195,194,,,,,,,,,,,,,,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,"",""
      |OU0490,OU0490,ZAG,/,Expected,2022-07-22 19:15,2022-07-22 19:15,,,,,2022-07-22 19:38,151,151,,,,,,,,,,,,,,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,"",""
      |TG0916,TG0916,BKK,/,Expected,2022-07-22 19:10,2022-07-22 18:57,,,,,2022-07-22 19:41,235,232,,,,,,,,,,,,,,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,"",""
      |LX0338,LX0338,ZRH,/,Expected,2022-07-22 19:25,2022-07-22 19:25,,,,,2022-07-22 19:48,157,157,,,,,,,,,,,,,,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,"",""
      |SK1507,SK1507,CPH,/,Expected,2022-07-22 19:30,2022-07-22 19:30,,,,,2022-07-22 19:53,157,157,,,,,,,,,,,,,,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,"",""
      |BE1228,BE1228,AMS,/,Expected,2022-07-22 19:35,2022-07-22 19:35,,,,,2022-07-22 19:58,68,68,,,,,,,,,,,,,,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,"",""
      |SQ0318,SQ0318,SIN,/,Delayed,2022-07-22 19:15,2022-07-22 19:44,,,,,2022-07-22 20:07,240,227,,,,,,,,,,,,,,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,"",""
      |SK0533,SK0533,ARN,/,Expected,2022-07-22 19:55,2022-07-22 19:55,,,,,2022-07-22 20:18,157,157,,,,,,,,,,,,,,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,"",""
      |0B1531,0B1531,OTP,/,Expected,2022-07-22 20:10,2022-07-22 20:10,,,,,2022-07-22 20:33,164,164,,,,,,,,,,,,,,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,"",""
      |FI0454,FI0454,KEF,/,Scheduled,2022-07-22 20:20,,,,,,2022-07-22 20:43,228,193,,,,,,,,,,,,,,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,"",""
      |UA0934,UA0934,EWR,/,Scheduled,2022-07-22 20:40,,,,,,2022-07-22 21:03,145,240,,,,,,,,,,,,,,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,"",""
      |OS0457,OS0457,VIE,/,Scheduled,2022-07-22 21:40,,,,,,2022-07-22 22:03,151,174,,,,,,,,,,,,,,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,0.0,"",""
      |""".stripMargin
}
