package uk.gov.homeoffice.drt

import org.scalatest.matchers.should.Matchers
import org.scalatest.wordspec.AnyWordSpec
import uk.gov.homeoffice.drt.healthchecks.{ ApiHealthCheck, ArrivalLandingTimesHealthCheck, ArrivalUpdatesHealthCheck }

class ServerSpec extends AnyWordSpec with Matchers {
  "Server.portHealthChecks" should {
    "include the live port health checks" in {
      Server.portHealthChecks.map(_.getClass) should contain allOf (
        classOf[ApiHealthCheck],
        classOf[ArrivalLandingTimesHealthCheck],
        classOf[ArrivalUpdatesHealthCheck]
      )
    }
  }
}
