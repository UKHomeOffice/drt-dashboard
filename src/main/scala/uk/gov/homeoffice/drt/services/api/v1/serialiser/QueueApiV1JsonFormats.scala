package uk.gov.homeoffice.drt.services.api.v1.serialiser

import spray.json._
import uk.gov.homeoffice.drt.ports.Queues.Queue
import uk.gov.homeoffice.drt.routes.api.v1.QueueApiV1Routes.{ QueueJsonResponseV1, QueueJsonV1, SlotJsonV1 }
import uk.gov.homeoffice.drt.time.SDateLike

trait QueueApiV1JsonFormats extends DefaultJsonProtocol with CommonJsonFormatsV1 {
  implicit object QueueJsonFormat extends RootJsonFormat[Queue] {
    override def write(obj: Queue): JsValue = obj.stringValue.toJson

    override def read(json: JsValue): Queue = json match {
      case JsString(value) => Queue(value)
      case unexpected      => throw new Exception(s"Failed to parse Queue. Expected JsString. Got ${unexpected.getClass}")
    }
  }

  implicit val queueJsonFormat: RootJsonFormat[QueueJsonV1] = jsonFormat3(QueueJsonV1.apply)

  implicit val periodJsonFormat: RootJsonFormat[SlotJsonV1] = jsonFormat4(SlotJsonV1.apply)

  implicit object jsonResponseFormat extends RootJsonFormat[QueueJsonResponseV1] {

    override def write(obj: QueueJsonResponseV1): JsValue = obj match {
      case obj: QueueJsonResponseV1 => JsObject(Map(
          "periodStart" -> obj.periodStart.toJson,
          "periodEnd" -> obj.periodEnd.toJson,
          "periodLengthMinutes" -> obj.slotSizeMinutes.toJson,
          "periods" -> obj.slots.toJson
        ))
    }

    override def read(json: JsValue): QueueJsonResponseV1 = json match {
      case JsObject(fields) =>
        QueueJsonResponseV1(
          periodStart = fields("periodStart").convertTo[SDateLike],
          periodEnd = fields("periodEnd").convertTo[SDateLike],
          slotSizeMinutes = fields("periodLengthMinutes").convertTo[Int],
          slots = fields("periods").convertTo[Seq[SlotJsonV1]]
        )
      case unexpected =>
        throw new Exception(s"Failed to parse QueueJsonResponse. Expected JsObject. Got ${unexpected.getClass}")
    }
  }
}
