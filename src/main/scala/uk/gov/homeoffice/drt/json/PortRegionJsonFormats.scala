package uk.gov.homeoffice.drt.json

import spray.json.{ enrichAny, DefaultJsonProtocol, JsArray, JsObject, JsString, JsValue, RootJsonFormat }
import uk.gov.homeoffice.drt.ports.PortRegion

object PortRegionJsonFormats extends DefaultJsonProtocol {
  implicit object PortRegionJsonFormat extends RootJsonFormat[PortRegion] {
    override def read(json: JsValue): PortRegion = throw new Exception("Deserialising PortRegion not implemented yet")

    override def write(obj: PortRegion): JsValue = JsObject(Map(
      "name" -> obj.name.toJson,
      "ports" -> JsArray(obj.ports.map(pc => JsString(pc.iata)).toVector)
    ))
  }
}
