# Go-live verification

Read this before deploying. It separates what has actually been proven from
what has not, so nothing is taken on trust.

## Proven

Verified by executing it, not by reading it.

| Area | How it was proven |
| --- | --- |
| All 9 migrations apply to a clean Postgres 16, in order | Run from scratch locally and in CI |
| RLS enabled on all six tables | Asserted in CI; the build fails if it is ever off |
| A user cannot grant themselves Premium | Attempted as the `authenticated` role; rejected. Asserted in CI |
| Full user journey at the SQL layer | Signup trigger → profile edit → list a skill → discover → swap request → accept → message → read receipt → complete → rate both ways → leaderboard → usage widget. Every statement issued as the `authenticated` role with a real JWT claim |
| Stripe webhook path | Simulated as the service role with `auth.uid()` null: upgrade sets premium, filters and caps change immediately, cancellation returns the account to free and the free cap is enforced again |
| Plan limits | Each cap hit and rejected with its own SQLSTATE |
| Web build, typecheck, lint | Clean, in CI |
| CSP, security headers, hydration | Checked in a real browser: no violations, no console errors, theme toggle works |
| Responsive layout | 320–1536px, no horizontal overflow on any page |
| Android build and every screen rendering | Debug and release APKs build; all 13 screens render via Robolectric |

## Not proven — you must check these

There is no Docker or emulator in the build environment, so nothing below
could be executed. **None of it is known to be broken; none of it is known to
work.**

1. **Supabase Auth end to end.** Sign up, confirm a `profiles` row appears with
   `plan='free'`, sign out, sign back in. The SQL trigger behind it is proven;
   the HTTP round trip is not.
2. **Any authenticated page rendering with live data.** The queries are proven
   at the SQL layer, but no signed-in page has ever been rendered against a
   real Supabase.
3. **Realtime messaging.** Open one conversation in two browsers as two users
   and confirm a message arrives without refreshing. If it does not, check that
   Realtime is enabled for the `messages` table **in the hosted project**, not
   just in the migration.
4. **Stripe checkout in a browser.** Card `4242 4242 4242 4242`. Confirm the
   badge flips to Premium and filters unlock with no manual database edit.
5. **The Android app on a device.** It compiles and renders, but has never run.

## Order to do it in

```bash
# 1. Local, with Docker running
npx supabase start
npx supabase db reset        # applies migrations + seeds two test users
npm run dev
```

Seeded accounts: `mara@example.com` (free) and `luca@example.com` (premium),
password `password123` for both.

Walk items 1–4 above locally first. Only then deploy, and repeat items 1–4 on
the deployed site — the hosted project has its own Realtime setting, its own
auth redirect URLs, and live-mode Stripe keys, and each of those has failed for
somebody before.

## Blockers found and fixed during this pass

- **Android billing pointed at a placeholder domain.** `WEB_ORIGIN` was
  hardcoded to `https://skillswap.example.com`, so Upgrade and Manage billing
  would have opened a dead link. It now comes from `local.properties` /
  CI, and when it is blank the buttons are disabled with an explanation rather
  than sending people nowhere. **Set `WEB_ORIGIN` to your real domain before
  building a release APK.**

## Required configuration

| Variable | Where | Notes |
| --- | --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | Vercel | Public |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Vercel | Public; RLS still applies |
| `SUPABASE_SERVICE_ROLE_KEY` | Vercel | **Secret.** Bypasses RLS; used only by the Stripe webhook |
| `STRIPE_SECRET_KEY` | Vercel | **Secret.** Live key for production |
| `STRIPE_PREMIUM_PRICE_ID` | Vercel | Must be a **live-mode** price id |
| `STRIPE_WEBHOOK_SECRET` | Vercel | The deployed endpoint's secret, not the `stripe listen` one |
| `SUPABASE_URL` / `SUPABASE_ANON_KEY` / `WEB_ORIGIN` | `android/local.properties` | Never commit |

Redeploy after changing any of these — Vercel does not apply new environment
variables to an existing build.
