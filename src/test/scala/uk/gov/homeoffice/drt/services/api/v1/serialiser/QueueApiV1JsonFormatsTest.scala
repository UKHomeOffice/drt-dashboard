package uk.gov.homeoffice.drt.services.api.v1.serialiser

import org.scalatest.matchers.should.Matchers
import org.scalatest.wordspec.AnyWordSpec
import uk.gov.homeoffice.drt.ports.PortCode
import uk.gov.homeoffice.drt.ports.Queues.EeaDesk
import uk.gov.homeoffice.drt.ports.Terminals.T2
import uk.gov.homeoffice.drt.routes.api.v1.QueueApiV1Routes.{ QueueJsonResponseV1, QueueJsonV1, SlotJsonV1 }
import uk.gov.homeoffice.drt.time.SDate

class QueueApiV1JsonFormatsTest extends AnyWordSpec with Matchers with QueueApiV1JsonFormats {
  "QueueJsonFormat should serialise and deserialise correctly" in {
    val queue = QueueJsonV1(EeaDesk, 100, 10)
    val json = queue.toJson
    val deserialised = json.convertTo[QueueJsonV1]

    deserialised shouldEqual queue
  }

  "PeriodJsonFormat should serialise and deserialise correctly" in {
    val start = SDate("2024-10-20T10:00")
    val period = SlotJsonV1(start, PortCode("LHR"), T2, Seq(QueueJsonV1(EeaDesk, 100, 10)))
    val json = period.toJson
    val deserialised = json.convertTo[SlotJsonV1]

    deserialised shouldEqual period
  }

  "jsonResponseFormat should serialise and deserialise correctly" in {
    val start = SDate("2024-10-20T10:00")
    val end = SDate("2024-10-20T12:00")
    val slotSizeMinutes = 15
    val slots = Seq(
      SlotJsonV1(start, PortCode("LHR"), T2, Seq(QueueJsonV1(EeaDesk, 100, 10))),
      SlotJsonV1(start.addMinutes(15), PortCode("LHR"), T2, Seq(QueueJsonV1(EeaDesk, 120, 12)))
    )
    val response = QueueJsonResponseV1(start, end, slotSizeMinutes, slots)
    val json = response.toJson
    val deserialised = json.convertTo[QueueJsonResponseV1]

    deserialised shouldEqual response
  }
}
