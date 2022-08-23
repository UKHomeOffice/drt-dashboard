package uk.gov.homeoffice.drt.authentication

import akka.http.scaladsl.testkit.Specs2RouteTest
import org.specs2.mutable.Specification
import spray.json._

class AccessRequestSpec extends Specification with Specs2RouteTest with AccessRequestJsonSupport {
  "Given a json object string I should be able to parse it to an AccessRequest" >> {
    val string =
      """
        |{
        |    "lineManager": "someone@somewhere.com",
        |    "portsRequested": [
        |        "bhx",
        |        "lhr"
        |    ],
        |    "rccuRegionsRequested": [
        |       "North",
        |       "South"
        |    ],
        |    "staffing": true,
        |    "allPorts": true,
        |    "agreeDeclaration": true
        |}
        |""".stripMargin

    val request = string.parseJson.convertTo[AccessRequest]

    val expected = AccessRequest(
      portsRequested = Set("bhx", "lhr"),
      allPorts = true,
      staffing = true,
      regionsRequested = Set("North", "South"),
      lineManager = "someone@somewhere.com",
      agreeDeclaration = true)

    request === expected
  }
}
