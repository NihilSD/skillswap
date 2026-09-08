# SkillSwap for Android

Native Kotlin + Jetpack Compose client for SkillSwap. It talks to the **same
Supabase project** as the web app.

## Why there is no separate backend

Every rule in SkillSwap lives in Postgres — Row Level Security policies plus
trigger functions for the plan limits. This client uses the anon key and gets
all of that enforcement for free:

| Rule | Enforced by | Applies to this app? |
| --- | --- | --- |
| 1 / 3 skill listings | `can_add_skill_listing()` trigger | Yes |
| Premium-only browse filters | `discover_listings()` drops filter args | Yes |
| 1 / 3 swap requests per day | `can_send_swap_request()` trigger | Yes |
| 10 / unlimited messages per day | `can_send_message()` trigger | Yes |
| Who can read what | RLS policies | Yes |
| Plan cannot be self-assigned | `SS007` trigger + column privileges | Yes |

No API layer was rewritten, and the app cannot bypass a limit the website
cannot bypass.

## Setup

1. Install the Android SDK (API 35, build-tools 35.0.0) and JDK 17+.
2. Add your Supabase credentials to `android/local.properties` (git-ignored):

   ```properties
   sdk.dir=/path/to/Android/Sdk
   SUPABASE_URL=https://<project-ref>.supabase.co
   SUPABASE_ANON_KEY=<your anon key>
   ```

   Only the URL and **anon** key belong here. The service-role key bypasses RLS
   and must never be shipped in a mobile app.

   Running against a local Supabase from the emulator? The emulator reaches the
   host at `10.0.2.2`, so use `http://10.0.2.2:54321`.

3. Build and install:

   ```bash
   cd android
   ./gradlew :app:assembleDebug
   ./gradlew :app:installDebug     # with a device or emulator attached
   ```

## Project layout

```
app/src/main/kotlin/com/skillswap/app/
  MainActivity.kt          Single activity, Compose entry point
  data/
    Supabase.kt            The one Supabase client (anon key, RLS applies)
    Models.kt              Serializable mirrors of the Postgres schema
    PlanLimits.kt          Display-only limits + SQLSTATE -> friendly copy
  ui/
    theme/                 The web app's palette, type scale and shapes
    SkillSwapApp.kt        Root composable
```

## Notes

- `minSdk 26`, `targetSdk 35`, Material 3, edge-to-edge, light and dark themes
  driven by the system setting.
- Backups are disabled for shared preferences and files so the auth session is
  never captured in a cloud backup.
- Maven Central rate-limits some CI environments; `settings.gradle.kts` tries
  Google's official Central mirror first and falls back to `mavenCentral()`.
