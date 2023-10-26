package uk.gov.homeoffice.drt.db

import org.joda.time.DateTime
import org.joda.time.format.DateTimeFormat
import org.specs2.mutable.Specification
import org.specs2.specification.BeforeEach
import slick.dbio.DBIO
import slick.jdbc.PostgresProfile.api._

import java.sql.Timestamp
import java.time.{Duration, Instant}
import scala.concurrent.Await
import scala.concurrent.ExecutionContext.Implicits.global
import scala.concurrent.duration.DurationInt

class UserAccessRequestDaoSpec extends Specification with BeforeEach {
  sequential

  lazy val db = TestDatabase.db

  override protected def before = {
    println(s"before ${DateTime.now().toString(DateTimeFormat.forPattern("yyyy-MM-dd HH:mm:ss"))}")
    Await.ready(
      db.run(DBIO.seq(
        TestDatabase.userAccessRequestsTable.schema.dropIfExists,
        TestDatabase.userAccessRequestsTable.schema.createIfNotExists)
      ), 2.second)
  }

  "UserAccessRequestDao list" >> {
    "should return a list of user Access Requested" >> {
      val userAccessRequestDao = UserAccessRequestDao(TestDatabase.db)
      Await.result(userAccessRequestDao.insertOrUpdate(UserAccessRequest(email = "test@test.com",
        portsRequested = "",
        allPorts = false,
        regionsRequested = "",
        staffEditing = false,
        lineManager = "",
        agreeDeclaration = true,
        accountType = "port",
        portOrRegionText = "lhr",
        staffText = "",
        status = "Requested",
        requestTime = new Timestamp(Instant.now().minusSeconds(60).toEpochMilli))), 1.second)
      val userAccessRequests = Await.result(userAccessRequestDao.selectAll(), 1.second)

      userAccessRequests.size mustEqual 1
    }

  }

  "UserAccessRequestDao list" >> {

    "should not return user Access Requested as request date before sep" >> {
      val userAccessRequestDao = UserAccessRequestDao(TestDatabase.db)
      Await.result(
        userAccessRequestDao.insertOrUpdate(
          UserAccessRequest(email = "test@test.com",
            portsRequested = "",
            allPorts = false,
            regionsRequested = "",
            staffEditing = false,
            lineManager = "",
            agreeDeclaration = true,
            accountType = "port",
            portOrRegionText = "lhr",
            staffText = "",
            status = "Approved",
            requestTime = new Timestamp(
              DateTime.parse("2023-08-30 15:10:10.000",
                DateTimeFormat.forPattern("YYYY-MM-dd HH:mm:ss.SSS")).getMillis))),
        1.second)
      val userAccessRequests = Await.result(userAccessRequestDao.selectApprovedUserAfterSpecificDate(), 1.second)

      userAccessRequests.size mustEqual 0
    }

    "should not return user Access Requested as request date not before 15 days" >> {
      val userAccessRequestDao = UserAccessRequestDao(TestDatabase.db)
      Await.result(
        userAccessRequestDao.insertOrUpdate(
          UserAccessRequest(email = "test@test.com",
            portsRequested = "",
            allPorts = false,
            regionsRequested = "",
            staffEditing = false,
            lineManager = "",
            agreeDeclaration = true,
            accountType = "port",
            portOrRegionText = "lhr",
            staffText = "",
            status = "Approved",
            requestTime = Timestamp.from(Instant.now.minus(Duration.ofDays(14))))),
        1.second)
      val userAccessRequests = Await.result(userAccessRequestDao.selectApprovedUserAfterSpecificDate(), 1.second)

      userAccessRequests.size mustEqual 0
    }

    "should return user Access Requested as request date before 15 days" >> {
      val userAccessRequestDao = UserAccessRequestDao(TestDatabase.db)
      Await.result(
        userAccessRequestDao.insertOrUpdate(
          UserAccessRequest(email = "test@test.com",
            portsRequested = "",
            allPorts = false,
            regionsRequested = "",
            staffEditing = false,
            lineManager = "",
            agreeDeclaration = true,
            accountType = "port",
            portOrRegionText = "lhr",
            staffText = "",
            status = "Approved",
            requestTime = Timestamp.from(Instant.now.minus(Duration.ofDays(16))))),
        1.second)
      val userAccessRequests = Await.result(userAccessRequestDao.selectApprovedUserAfterSpecificDate(), 1.second)

      userAccessRequests.size mustEqual 1
    }
  }
}
