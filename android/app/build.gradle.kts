import java.util.Properties

plugins {
    alias(libs.plugins.android.application)
    alias(libs.plugins.kotlin.android)
    alias(libs.plugins.kotlin.compose)
    alias(libs.plugins.kotlin.serialization)
    alias(libs.plugins.roborazzi)
}

/**
 * Supabase credentials come from android/local.properties (git-ignored) so no
 * keys are committed. Only the URL and the anon key belong here — the anon key
 * is safe on a client because every query is still constrained by RLS.
 *
 * The service-role key must NEVER appear in this file or anywhere in the app.
 */
val localProperties = Properties().apply {
    val file = rootProject.file("local.properties")
    if (file.exists()) file.inputStream().use { load(it) }
}

fun secret(key: String, fallback: String = ""): String =
    (localProperties.getProperty(key) ?: System.getenv(key) ?: fallback)

android {
    namespace = "com.skillswap.app"
    compileSdk = 35

    /**
     * Release signing is configured only when a keystore is actually supplied,
     * so a plain `assembleRelease` still works for anyone building from a
     * fresh clone — it just produces an unsigned APK.
     *
     * Supply these in local.properties (git-ignored) or as CI secrets:
     *   RELEASE_STORE_FILE, RELEASE_STORE_PASSWORD,
     *   RELEASE_KEY_ALIAS, RELEASE_KEY_PASSWORD
     *
     * Create a keystore with:
     *   keytool -genkeypair -v -keystore skillswap-release.jks \
     *     -keyalg RSA -keysize 4096 -validity 10000 -alias skillswap
     *
     * Never commit the keystore or its passwords.
     */
    signingConfigs {
        val storeFilePath = secret("RELEASE_STORE_FILE")
        if (storeFilePath.isNotBlank() && file(storeFilePath).exists()) {
            create("release") {
                storeFile = file(storeFilePath)
                storePassword = secret("RELEASE_STORE_PASSWORD")
                keyAlias = secret("RELEASE_KEY_ALIAS")
                keyPassword = secret("RELEASE_KEY_PASSWORD")
            }
        }
    }

    defaultConfig {
        applicationId = "com.skillswap.app"
        minSdk = 26
        targetSdk = 35
        versionCode = 1
        versionName = "1.0.0"

        buildConfigField("String", "SUPABASE_URL", "\"${secret("SUPABASE_URL")}\"")
        buildConfigField("String", "SUPABASE_ANON_KEY", "\"${secret("SUPABASE_ANON_KEY")}\"")

        // Where the web app is deployed. Stripe Checkout and the billing
        // portal run there, so this must point at the real domain before a
        // release build ships — the app refuses to open billing if it is unset
        // rather than sending people to a dead link.
        buildConfigField("String", "WEB_ORIGIN", "\"${secret("WEB_ORIGIN")}\"")
    }

    buildTypes {
        debug {
            isMinifyEnabled = false
        }
        release {
            isMinifyEnabled = true
            isShrinkResources = true
            proguardFiles(getDefaultProguardFile("proguard-android-optimize.txt"), "proguard-rules.pro")
            signingConfig = signingConfigs.findByName("release")
        }
    }

    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_17
        targetCompatibility = JavaVersion.VERSION_17
    }

    kotlinOptions {
        jvmTarget = "17"
    }

    buildFeatures {
        compose = true
        buildConfig = true
    }

    packaging {
        resources.excludes += "/META-INF/{AL2.0,LGPL2.1}"
    }

    sourceSets["main"].java.srcDirs("src/main/kotlin")
    sourceSets["test"].java.srcDirs("src/test/kotlin")

    // Screenshot tests render real Compose UI on the JVM via Robolectric,
    // which needs the merged Android resources.
    testOptions {
        unitTests {
            isIncludeAndroidResources = true
            all { it.systemProperty("robolectric.graphicsMode", "NATIVE") }
        }
    }
}

dependencies {
    implementation(libs.androidx.core.ktx)
    implementation(libs.androidx.lifecycle.runtime.ktx)
    implementation(libs.androidx.lifecycle.viewmodel.compose)
    implementation(libs.androidx.activity.compose)

    implementation(platform(libs.androidx.compose.bom))
    implementation(libs.androidx.ui)
    implementation(libs.androidx.ui.graphics)
    implementation(libs.androidx.ui.tooling.preview)
    implementation(libs.androidx.material3)
    implementation(libs.androidx.material.icons.extended)
    debugImplementation(libs.androidx.ui.tooling)

    implementation(libs.androidx.navigation.compose)
    implementation(libs.androidx.datastore.preferences)
    implementation(libs.androidx.browser)

    implementation(libs.kotlinx.coroutines.android)
    implementation(libs.kotlinx.serialization.json)

    implementation(platform(libs.supabase.bom))
    implementation(libs.supabase.postgrest)
    implementation(libs.supabase.auth)
    implementation(libs.supabase.realtime)
    implementation(libs.ktor.client.okhttp)

    implementation(libs.coil.compose)

    testImplementation(libs.junit)
    testImplementation(libs.robolectric)
    testImplementation(libs.androidx.test.core)
    testImplementation(platform(libs.androidx.compose.bom))
    testImplementation(libs.androidx.ui.test.junit4)
    testImplementation(libs.roborazzi)
    testImplementation(libs.roborazzi.compose)
    testImplementation(libs.roborazzi.rule)
    debugImplementation(libs.androidx.ui.test.manifest)
}
