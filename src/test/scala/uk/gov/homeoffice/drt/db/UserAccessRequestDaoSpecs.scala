package uk.gov.homeoffice.drt.db

import org.joda.time.DateTime
import org.specs2.mutable.Specification
import slick.dbio.{Effect, NoStream}
import slick.sql.FixedSqlAction

import java.sql.{Date, Timestamp}

class UserAccessRequestDaoSpecs extends Specification {
  "insert userAccessRequest" >> {
    val a: FixedSqlAction[Int, NoStream, Effect.Write] = UserAccessRequestDao.insert(UserAccessRequest("test@test.com", "some,some", false, "", false, "", true, false, "", "", "request", new Timestamp(DateTime.now().getMillis)))
    a must_!= None
  }
}
