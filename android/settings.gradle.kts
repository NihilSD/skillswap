pluginManagement {
    repositories {
        google {
            content {
                includeGroupByRegex("com\\.android.*")
                includeGroupByRegex("com\\.google.*")
                includeGroupByRegex("androidx.*")
            }
        }
        // Maven Central's primary host rate-limits this environment (HTTP 429).
        // Google's official read-only GCS mirror of Central is tried first and
        // mavenCentral() remains as the fallback, so resolution is unaffected
        // for anyone building elsewhere.
        maven("https://maven-central.storage-download.googleapis.com/maven2") {
            content { includeGroupByRegex(".*") }
        }
        mavenCentral()
        gradlePluginPortal()
    }
}

dependencyResolutionManagement {
    repositoriesMode.set(RepositoriesMode.FAIL_ON_PROJECT_REPOS)
    repositories {
        google()
        // Maven Central's primary host rate-limits this environment (HTTP 429).
        // Google's official read-only GCS mirror of Central is tried first and
        // mavenCentral() remains as the fallback, so resolution is unaffected
        // for anyone building elsewhere.
        maven("https://maven-central.storage-download.googleapis.com/maven2") {
            content { includeGroupByRegex(".*") }
        }
        mavenCentral()
    }
}

rootProject.name = "SkillSwap"
include(":app")
