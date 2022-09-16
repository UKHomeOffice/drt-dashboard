import sbt.Keys.resolvers

lazy val akkaHttpVersion = "10.2.6"
lazy val akkaVersion = "2.6.19"
lazy val jodaTimeVersion = "2.9.4"
lazy val scalaLoggingVersion = "3.9.2"
lazy val logBackClassicVersion = "1.1.3"
lazy val scalaTagsVersion = "0.8.2"
lazy val specs2Version = "4.6.0"
lazy val logBackJsonVersion = "0.1.5"
lazy val drtCiriumVersion = "56"
lazy val drtLibVersion = "v306"
lazy val janinoVersion = "3.1.6"
lazy val scalaTestVersion = "3.2.9"
lazy val jacksonDatabindVersion = "2.11.2"
lazy val notificationsJavaClientVersion = "3.17.3-RELEASE"
lazy val scalaCsv = "1.3.8"

lazy val root = (project in file(".")).
  settings(
    inThisBuild(List(
      organization := "uk.gov.homeoffice.drt",
      scalaVersion := "2.12.8"
    )),

    version := sys.env.getOrElse("DRONE_BUILD_NUMBER", sys.env.getOrElse("BUILD_ID", "DEV")),
    name := "drt-dashboard",
    credentials += Credentials(Path.userHome / ".ivy2" / ".credentials"),
    libraryDependencies ++= Seq(
      "com.typesafe.akka" %% "akka-http" % akkaHttpVersion,
      "com.typesafe.akka" %% "akka-stream" % akkaVersion,
      "com.typesafe.akka" %% "akka-actor-typed" % akkaVersion,
      "com.typesafe.akka" %% "akka-http-spray-json" % akkaHttpVersion,
      "joda-time" % "joda-time" % jodaTimeVersion,
      "com.typesafe.scala-logging" %% "scala-logging" % scalaLoggingVersion,
      "ch.qos.logback" % "logback-classic" % logBackClassicVersion % Runtime,
      "com.lihaoyi" %% "scalatags" % scalaTagsVersion,
      "uk.gov.homeoffice" %% "drt-cirium" % drtCiriumVersion,
      "uk.gov.homeoffice" %% "drt-lib" % drtLibVersion,
      "ch.qos.logback.contrib" % "logback-json-classic" % logBackJsonVersion,
      "ch.qos.logback.contrib" % "logback-jackson" % logBackJsonVersion,
      "org.codehaus.janino" % "janino" % janinoVersion,
      "com.fasterxml.jackson.core" % "jackson-databind" % jacksonDatabindVersion,
      "uk.gov.service.notify" % "notifications-java-client" % notificationsJavaClientVersion,
      "com.github.tototoshi" %% "scala-csv" % scalaCsv,
      "org.scalactic" %% "scalactic" % scalaTestVersion,

      "com.typesafe.slick" %% "slick" % "3.4.1",
//      "org.slf4j" % "slf4j-nop" % "1.7.26",
      "com.typesafe.slick" %% "slick-hikaricp" % "3.4.1",
      "org.postgresql" % "postgresql" % "42.2.5",

      "com.typesafe.akka" %% "akka-http-testkit" % akkaHttpVersion % Test,
      "com.typesafe.akka" %% "akka-stream-testkit" % akkaVersion % Test,
      "com.typesafe.akka" %% "akka-actor-testkit-typed" % akkaVersion % Test,
      "org.scalatest" %% "scalatest" % scalaTestVersion % Test,

      "org.specs2" %% "specs2-core" % specs2Version % Test
    ),

    resolvers += "Artifactory Release Realm" at "https://artifactory.digital.homeoffice.gov.uk/",
    resolvers += "Artifactory Realm release local" at "https://artifactory.digital.homeoffice.gov.uk/artifactory/libs-release-local/",
    resolvers += "Spring Lib Release Repository" at "https://repo.spring.io/libs-release/",
    resolvers += "Sonatype OSS Snapshots" at "https://oss.sonatype.org/content/repositories/snapshots",

    dockerExposedPorts ++= Seq(8081),

  )
  .enablePlugins(DockerPlugin)
  .enablePlugins(JavaAppPackaging)

javaOptions in Test += "-Duser.timezone=UTC"

javaOptions in Runtime += "-Duser.timezone=UTC"

fork in run := true
cancelable in Global := true
