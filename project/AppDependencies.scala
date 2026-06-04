import sbt.*

object AppDependencies {
  private val pekkoVersion = "1.4.0"
  private val pekkoHttpVersion = "1.3.0"
  private val slickVersion = "3.5.2"
  private val logbackJsonVersion = "0.1.5"
  private val scalaTestVersion = "3.2.20"

  private val ciriumVersion = "v416"
  private val drtLibVersion = "v1415"

  val compileDependencies: Seq[ModuleID] = Seq(
    "org.apache.pekko"           %% "pekko-actor-typed"         % pekkoVersion,
    "org.apache.pekko"           %% "pekko-http"                % pekkoHttpVersion,
    "org.apache.pekko"           %% "pekko-http-caching"        % pekkoHttpVersion,
    "org.apache.pekko"           %% "pekko-stream"              % pekkoVersion,
    "org.apache.pekko"           %% "pekko-pki"                 % pekkoVersion,
    "org.apache.pekko"           %% "pekko-http-spray-json"     % pekkoHttpVersion,
    "joda-time"                   % "joda-time"                 % "2.14.2",
    "com.typesafe.scala-logging" %% "scala-logging"             % "3.9.6",
    "ch.qos.logback"              % "logback-classic"           % "1.5.34" % Runtime,
    "com.lihaoyi"                %% "scalatags"                 % "0.13.1",
    "uk.gov.homeoffice"          %% "drt-cirium"                % ciriumVersion,
    "uk.gov.homeoffice"          %% "drt-lib"                   % drtLibVersion exclude ("org.scala-lang.modules", "scala-xml"),
    "ch.qos.logback.contrib"      % "logback-json-classic"      % logbackJsonVersion,
    "ch.qos.logback.contrib"      % "logback-jackson"           % logbackJsonVersion,
    "org.codehaus.janino"         % "janino"                    % "3.1.12",
    "com.fasterxml.jackson.core"  % "jackson-databind"          % "2.21.3",
    "uk.gov.service.notify"       % "notifications-java-client" % "6.0.0-RELEASE",
    "com.github.tototoshi"       %% "scala-csv"                 % "2.0.0",
    "org.scalactic"              %% "scalactic"                 % scalaTestVersion,
    "software.amazon.awssdk"      % "s3"                        % "2.45.1",
    "info.folone"                %% "poi-scala"                 % "2.1.1",
    "com.typesafe.slick"         %% "slick"                     % slickVersion,
    "com.typesafe.slick"         %% "slick-hikaricp"            % slickVersion,
    "org.postgresql"              % "postgresql"                % "42.7.11"
  )

  val testDependencies: Seq[ModuleID] = Seq(
    "com.h2database"    % "h2"                        % "2.4.240"        % Test,
    "org.apache.pekko" %% "pekko-http-testkit"        % pekkoHttpVersion % Test,
    "org.apache.pekko" %% "pekko-stream-testkit"      % pekkoVersion     % Test,
    "org.apache.pekko" %% "pekko-actor-testkit-typed" % pekkoVersion     % Test,
    "org.scalatest"    %% "scalatest"                 % scalaTestVersion % Test,
    "org.specs2"       %% "specs2-core"               % "4.23.0"         % Test,
    "org.mockito"       % "mockito-core"              % "5.23.0"         % Test
  )

  val all: Seq[ModuleID] = compileDependencies ++ testDependencies
}
