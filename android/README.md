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

## What is implemented

| Screen | Notes |
| --- | --- |
| Sign in / sign up | Supabase Auth; handles the email-confirmation case; sign-in errors stay vague about which field was wrong |
| Discover | Marketplace list; Premium gets search, category filter and best-match sort, free users see a locked filter card. The gate is inside `discover_listings()` — this client cannot bypass it |
| Matches | Incoming and sent requests, accept / decline, mark completed, star rating sheet |
| Messages | Conversation list and thread, **Supabase Realtime** `postgres_changes` INSERT subscription, daily limit banner that keeps your draft |
| Leaderboard | `get_leaderboard()` and `get_user_rank()`, medals, star ratings, skill tags |
| Profile | Emoji avatar picker, name and bio, skill listings with active toggle, wanted skills, and the plan usage widget fed by `get_plan_usage()` |
| Pricing | Plan comparison; Checkout and the billing portal open in a Chrome Custom Tab so the app never touches card details |

Navigation is a five-tab bottom bar (Discover, Matches, Messages, Ranks,
Profile) with Pricing pushed on top from upgrade prompts.

## Project layout

```
app/src/main/kotlin/com/skillswap/app/
  MainActivity.kt          Single activity, Compose entry point
  data/
    Supabase.kt            The one Supabase client (anon key, RLS applies)
    Models.kt              Serializable mirrors of the Postgres schema
    PlanLimits.kt          Display-only limits + SQLSTATE -> friendly copy
  navigation/Routes.kt     Route names and the bottom-tab list
  data/repo/               PostgREST wrappers — no business logic, by design
  ui/
    theme/                 The web app's palette, type scale and shapes
    components/Common.kt   SsCard, SsPrimaryButton, SsChip, PlanBadge, ...
    screens/               One package per feature
    SessionViewModel.kt    Auth session + signed-in profile, one source of truth
    SkillSwapApp.kt        Root composable and navigation graph
```

## Notes

- `minSdk 26`, `targetSdk 35`, Material 3, edge-to-edge, light and dark themes
  driven by the system setting.
- Backups are disabled for shared preferences and files so the auth session is
  never captured in a cloud backup.
- Maven Central rate-limits some CI environments; `settings.gradle.kts` tries
  Google's official Central mirror first and falls back to `mavenCentral()`.
- Cleartext HTTP is only permitted in **debug** builds, and only for
  `10.0.2.2`, `127.0.0.1` and `localhost`, so a local Supabase stack works in
  the emulator while release builds stay HTTPS-only.
- The release build runs R8 with resource shrinking: 21 MB debug → **2.1 MB**
  release. `proguard-rules.pro` keeps the kotlinx-serialization serializers.
- Payments deliberately live on the web. Stripe Checkout in a Custom Tab keeps
  card handling out of the app, and the plan flips here as soon as the webhook
  updates `profiles.plan`.

## Not done yet

- No signing config — release builds are unsigned. Add a keystore and a
  `signingConfigs` block before distributing.
- Push notifications for new messages and swap requests.
- Instrumented / screenshot tests. The app compiles and packages cleanly, but
  it has not been exercised on a device from this environment.
