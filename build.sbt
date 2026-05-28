import net.nmoncho.sbt.dependencycheck.settings.{AnalyzerSettings, NvdApiSettings}

ThisBuild / organization := "uk.gov.homeoffice.drt"
ThisBuild / scalaVersion := "2.13.18"

lazy val root = (project in file(".")).
  enablePlugins(DockerPlugin, JavaAppPackaging).
  settings(
    version := sys.env.getOrElse("DRONE_BUILD_NUMBER", sys.env.getOrElse("BUILD_ID", "DEV")),
    name := "drt-dashboard",
    credentials += Credentials(Path.userHome / ".ivy2" / ".credentials"),
    dockerBaseImage := "openjdk:11-jre-slim-buster",
    libraryDependencies ++= AppDependencies.all,
    resolvers ++= Seq(
      "Artifactory Release Realm" at "https://artifactory.digital.homeoffice.gov.uk/",
      "Artifactory Realm release local" at "https://artifactory.digital.homeoffice.gov.uk/artifactory/libs-release-local/",
      "Spring Lib Release Repository" at "https://repo.spring.io/libs-release/",
      "Sonatype OSS Snapshots" at "https://oss.sonatype.org/content/repositories/snapshots",
    ),

    dockerExposedPorts ++= Seq(8081),
    Compile / unmanagedResourceDirectories += baseDirectory.value / "src" / "main" / "resources",
    run / fork := true,
    Global / cancelable := true,
  )
  .settings(CodeCoverageSettings.codeCoverageSettings)
  .settings(SbtUpdatesSettings.sbtUpdatesSettings)
  .settings(WartRemoverSettings.wartRemoverSettings)

val nvdAPIKey = sys.env.getOrElse("NVD_API_KEY", "")

addCommandAlias("scalafmtAll", "all scalafmtSbt scalafmt Test/scalafmt")

dependencyCheckNvdApi := NvdApiSettings(apiKey = nvdAPIKey)

ThisBuild / dependencyCheckAnalyzers := dependencyCheckAnalyzers.value.copy(
  ossIndex = AnalyzerSettings.OssIndex(
    enabled = Some(false),
    url = None,
    batchSize = None,
    requestDelay = None,
    useCache = None,
    warnOnlyOnRemoteErrors = None,
    username = None,
    password = None
  )
)

