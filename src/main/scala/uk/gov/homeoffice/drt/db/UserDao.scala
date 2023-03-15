package uk.gov.homeoffice.drt.db

import org.slf4j.{Logger, LoggerFactory}
import slick.jdbc.PostgresProfile
import slick.jdbc.PostgresProfile.api._
import slick.lifted.{TableQuery, Tag}
import spray.json.RootJsonFormat

import java.sql.Timestamp
import java.time.Instant
import scala.concurrent.{ExecutionContext, Future}

trait UserJsonSupport extends DateTimeJsonSupport {
  implicit val userFormatParser: RootJsonFormat[User] = jsonFormat6(User)
}

case class User(
  id: String,
  username: String,
  email: String,
  latest_login: java.sql.Timestamp,
  inactive_email_sent: Option[java.sql.Timestamp],
  revoked_access: Option[java.sql.Timestamp])

class UserTable(tag: Tag, tableName: String = "user") extends Table[User](tag, tableName) {

  def id = column[String]("id", O.PrimaryKey)

  def username = column[String]("username")

  def email = column[String]("email")

  def latest_login = column[java.sql.Timestamp]("latest_login")

  def inactive_email_sent = column[Option[java.sql.Timestamp]]("inactive_email_sent")

  def revoked_access = column[Option[java.sql.Timestamp]]("revoked_access")

  def * = (id, username, email, latest_login, inactive_email_sent, revoked_access) <> (User.tupled, User.unapply)

}

trait IUserDao {
  def insertOrUpdate(userData: User): Future[Int]

  def selectInactiveUsers(numberOfInactivityDays: Int)(implicit executionContext: ExecutionContext): Future[Seq[User]]

  def selectUsersToRevokeAccess()(implicit executionContext: ExecutionContext): Future[Seq[User]]

  def selectAll()(implicit executionContext: ExecutionContext): Future[Seq[User]]

}

class UserDao(db: Database, userTable: TableQuery[UserTable]) extends IUserDao {
  val log: Logger = LoggerFactory.getLogger(getClass)

  def noActivitySinceDays(numberOfInactivityDays: Int): UserTable => Rep[Boolean] = (user: UserTable) =>
    user.inactive_email_sent.isEmpty &&
      user.latest_login < new Timestamp(Instant.now().minusSeconds(numberOfInactivityDays * 60 * 60 * 24).toEpochMilli)

  def accessShouldBeRevoked: UserTable => Rep[Boolean] = (user: UserTable) =>
    user.revoked_access.isEmpty &&
      user.inactive_email_sent.map(_ < new Timestamp(Instant.now().minusSeconds(7 * 60 * 60 * 24).toEpochMilli))
        .getOrElse(false)

  def insertOrUpdate(userData: User): Future[Int] = {
    db.run(userTable insertOrUpdate userData)
  }

  def selectInactiveUsers(numberOfInactivityDays: Int)(implicit executionContext: ExecutionContext): Future[Seq[User]] = {
    val inactiveIdx: UserTable => PostgresProfile.api.Rep[Boolean] = noActivitySinceDays(numberOfInactivityDays)
    db.run(userTable.filter(inactiveIdx).result)
      .mapTo[Seq[User]]
  }

  def selectUsersToRevokeAccess()(implicit executionContext: ExecutionContext): Future[Seq[User]] = {
    val revokeIdx: UserTable => PostgresProfile.api.Rep[Boolean] = accessShouldBeRevoked
    db.run(userTable.filter(revokeIdx).result)
      .mapTo[Seq[User]]
  }

  def selectAll()(implicit executionContext: ExecutionContext): Future[Seq[User]] = {
    db.run(userTable.result).mapTo[Seq[User]]
  }

}
