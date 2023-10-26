package uk.gov.homeoffice.drt.db

import org.specs2.mutable.Specification
import org.specs2.specification.BeforeEach
import slick.dbio.DBIO
import slick.jdbc.PostgresProfile.api._

import java.sql.Timestamp
import java.time.Instant
import scala.concurrent.Await
import scala.concurrent.duration.DurationInt

class DropInDaoSpec extends Specification with BeforeEach {

  lazy val db = TestDatabase.db

  override protected def before: Any = {
    Await.ready(
      db.run(DBIO.seq(
        TestDatabase.dropInTable.schema.dropIfExists,
        TestDatabase.dropInTable.schema.createIfNotExists)
      ), 2.second)
  }

  "DropInDao" >> {
    "should return insert and select drop-ins" >> {
      val dropInDao = new DropInDao(TestDatabase.db)
      Await.result(dropInDao.getFutureDropIns, 1.second).size mustEqual 0

      dropInDao.insertDropIn(title = "test",
        startTime = new Timestamp(Instant.now().minusSeconds(60).toEpochMilli),
        endTime = new Timestamp(Instant.now().minusSeconds(30).toEpochMilli),
        meetingLink = None)
      val dropIns = Await.result(dropInDao.getFutureDropIns, 1.second)

      dropIns.size mustEqual 1
    }
  }
}
