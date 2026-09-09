# SkillSwap

A marketplace for trading skills: list what you can teach, find someone teaching
what you want to learn, swap, chat in realtime, and rate each other.

Two clients, one backend:

| | |
| --- | --- |
| **Web** | Next.js 16 (App Router) · React 19 · TypeScript · Tailwind CSS |
| **Android** | Kotlin · Jetpack Compose · Material 3 — see [`android/`](android/) |
| **Backend** | Supabase — Postgres, Auth, Realtime, Row Level Security |
| **Billing** | Stripe Checkout + webhook |

The Android app needed **no backend changes at all**. Every rule — the plan
caps, the Premium-only filters, the daily limits, who can read what — lives in
Postgres, so a second client inherits all of it by using the same anon key.

Plan limits live in [`docs/plan-limits.md`](docs/plan-limits.md) and are enforced
in Postgres, not just in the UI. Where each one is enforced — and the findings
from a penetration test against them — is in
[`docs/enforcement-audit.md`](docs/enforcement-audit.md).

## Security posture

- Every plan limit is a Postgres trigger function or an RLS policy. A disabled
  button is a courtesy; the database is the control.
- RLS on all six tables, verified by a test suite run as the `authenticated`
  role — the same privileges a hand-crafted API call has.
- The service-role key is read in exactly one file and imported by exactly one
  route (the Stripe webhook), and appears in no client bundle or APK.
- Strict `Content-Security-Policy` with a per-request nonce, plus HSTS,
  `X-Frame-Options`, `nosniff`, `Referrer-Policy` and `Permissions-Policy`.
- CI blocks a merge if RLS is ever switched off or if the plan-escalation
  defence regresses.

---

## Local setup

### 1. Install dependencies

```bash
npm install
```

### 2. Start Supabase locally

Requires Docker to be running.

```bash
npx supabase start
```

This prints your local **API URL**, **anon key**, **service_role key** and the
**Studio URL** (usually http://127.0.0.1:54323). Useful follow-ups:

```bash
npx supabase status   # reprint the URLs and keys
npx supabase stop     # shut the local stack down
npx supabase db reset # re-apply all migrations from scratch
```

### 3. Configure environment variables

```bash
cp .env.local.example .env.local
```

Then paste the values printed by `supabase start`:

| Variable | Where it comes from | Exposed to browser? |
| --- | --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | `API URL` from `supabase status` | Yes |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `anon key` | Yes |
| `SUPABASE_SERVICE_ROLE_KEY` | `service_role key` | **No — server only** |

> ⚠️ **The service role key bypasses Row Level Security entirely.** It is only
> ever imported from trusted server code (the Stripe webhook route, Stage 8).
> Never put it in a Client Component and never prefix it with `NEXT_PUBLIC_`.

### 4. Start the dev server

```bash
npm run dev
```

Open http://localhost:3000.

---

## Creating the hosted Supabase project

1. Go to <https://supabase.com/dashboard> and **New project**. Pick an
   organisation, a name (`skillswap`), a strong database password (save it) and
   the region closest to your users.
2. Once it finishes provisioning, open **Project Settings → API** and copy:
   - **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
   - **anon / public** key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - **service_role** key → `SUPABASE_SERVICE_ROLE_KEY` (server-side secrets only)
3. Link the local CLI to it and push migrations (from Stage 1 onward):

   ```bash
   npx supabase link --project-ref <your-project-ref>
   npx supabase db push
   ```

---

## Project structure

```
app/                 App Router pages
components/          Shared UI components
lib/supabase/        client.ts (browser) and server.ts (SSR) Supabase clients
middleware.ts        Refreshes the Supabase auth session on every request
supabase/            Supabase CLI config and migrations
docs/plan-limits.md  Free vs Premium limits — the single source of truth
docs/enforcement-audit.md  Where each plan limit is actually enforced
```

## Continuous integration

[`.github/workflows/ci.yml`](.github/workflows/ci.yml) runs three jobs on every
push:

| Job | What it proves |
| --- | --- |
| **web** | Typecheck, lint and a production build succeed |
| **database** | Every migration applies in order to a clean Postgres, RLS is on for all six tables, and a user still cannot grant themselves Premium |
| **android** | The app assembles, and every screen still renders identically to the committed screenshots |

The database job is the important one: it turns "the limits are enforced in
Postgres" from a claim into something a broken commit cannot get past.

## Build stages

- [x] **Stage 0** — Scaffold, Supabase clients, design system, landing page
- [x] **Stage 1** — Database schema, signup trigger + RLS policies
- [x] **Stage 2** — Supabase Auth, protected routes, navbar with plan badge
- [x] **Stage 3** — Profile editing, skill listings, DB-enforced plan caps
- [x] **Stage 4** — Discover marketplace with DB-gated Premium filters
- [x] **Stage 5** — Swap requests with daily limits, accept/complete/rate flow
- [x] **Stage 6** — Private messaging over Supabase Realtime
- [x] **Stage 7** — Leaderboard aggregated in Postgres
- [x] **Stage 8** — Stripe Checkout, webhook and billing portal
- [x] **Stage 9** — Enforcement audit, usage widget, deployment checklist

---

## Stripe setup (Stage 8)

### Environment variables

| Variable | Where it comes from | Exposed to browser? |
| --- | --- | --- |
| `STRIPE_SECRET_KEY` | Stripe dashboard → Developers → API keys → **Secret key** | **No** |
| `STRIPE_PREMIUM_PRICE_ID` | Products → create a **$9/month recurring** price → copy its `price_…` id | **No** |
| `STRIPE_WEBHOOK_SECRET` | `stripe listen` locally, or the endpoint's signing secret in the dashboard | **No** |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase → Project Settings → API → **service_role** | **No** — required by the webhook |

There is no publishable key in this app: Checkout is created server-side and
the browser is simply redirected to Stripe's hosted page, so nothing Stripe
related ever needs to reach the client bundle.

### Testing the webhook locally

```bash
# 1. Install and log in
stripe login

# 2. Forward events to the local route. This prints the whsec_… to put in
#    .env.local as STRIPE_WEBHOOK_SECRET — then restart `npm run dev`.
stripe listen --forward-to localhost:3000/api/stripe/webhook

# 3. In another terminal, drive a real test checkout from /pricing using the
#    test card 4242 4242 4242 4242, any future expiry, any CVC.

# 4. Or fire events by hand:
stripe trigger checkout.session.completed
stripe trigger customer.subscription.deleted
```

`stripe trigger` sends synthetic events without your `supabase_user_id`
metadata, so they will be acknowledged but will not flip anyone's plan. To test
the real path, go through Checkout from `/pricing`.

### Where the service role key is used

Exactly one module reads it — `lib/supabase/admin.ts` — and exactly one route
imports that module: `app/api/stripe/webhook/route.ts`. The webhook runs as
Stripe, not as a signed-in user, so it cannot satisfy any RLS policy on
`profiles` and needs the key that bypasses RLS. It must never be imported
anywhere else.

---

## Seeding test users locally

`supabase/seed.sql` runs automatically on `supabase db reset` and creates two
confirmed accounts:

| Email | Password | Plan |
| --- | --- | --- |
| `mara@example.com` | `password123` | free |
| `luca@example.com` | `password123` | premium |

```bash
npx supabase db reset   # re-applies all migrations, then the seed
```

Local development only — never run the seed against a hosted project.

---

## Deployment checklist

### Supabase (hosted project)

- [ ] Create the project and copy the Project URL, anon key and service_role key.
- [ ] `npx supabase link --project-ref <ref>` then `npx supabase db push` to apply
      every migration.
- [ ] In Studio, confirm **RLS is enabled** on all six tables and the policies are listed.
- [ ] **Enable Realtime on the `messages` table in the hosted project too.**
      The migration adds it to the `supabase_realtime` publication, but check
      Database → Replication in the dashboard and confirm `messages` is on — this
      is the single easiest thing to forget, and chat silently falls back to
      "nothing ever arrives" without it.
- [ ] Authentication → URL Configuration: set the Site URL to your production
      domain and add it to the redirect allow-list, or confirmation links will
      point at localhost.
- [ ] Decide on email confirmation (Authentication → Providers → Email). The
      signup form handles both settings.

### Vercel

- [ ] Import the repo; framework preset Next.js, no build overrides needed.
- [ ] Environment variables (Production **and** Preview):
      `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`,
      `SUPABASE_SERVICE_ROLE_KEY`, `STRIPE_SECRET_KEY`,
      `STRIPE_PREMIUM_PRICE_ID`, `STRIPE_WEBHOOK_SECRET`.
- [ ] Only the two `NEXT_PUBLIC_*` values are meant to be public. Double-check
      nothing else was given that prefix.
- [ ] Deploy, then confirm `/` renders and `/discover` redirects to `/signin`
      when signed out.

### Stripe (live mode)

- [ ] Recreate the Premium product and price in **live** mode — test-mode price
      ids do not work live. Update `STRIPE_PREMIUM_PRICE_ID`.
- [ ] Swap `STRIPE_SECRET_KEY` for the live secret key.
- [ ] Add a webhook endpoint at `https://<your-domain>/api/stripe/webhook`
      subscribed to `checkout.session.completed` and
      `customer.subscription.deleted`; copy **that endpoint's** signing secret
      into `STRIPE_WEBHOOK_SECRET` (it differs from the local `stripe listen` one).
- [ ] Enable the Customer Portal (Settings → Billing → Customer portal) or the
      "Manage billing" button will error.
- [ ] Redeploy after changing env vars — Vercel does not apply them to an
      existing build.

### Smoke test on the deployed site

- [ ] Sign up → a `profiles` row appears with `plan='free'`.
- [ ] List a skill; a second one is refused with the upgrade message.
- [ ] Browse Discover; adding `?q=` by hand changes nothing on the free plan.
- [ ] Send a swap request; the second attempt shows the countdown.
- [ ] Accept, complete and rate from the other account.
- [ ] Message in two browsers and confirm messages arrive without refreshing.
- [ ] Upgrade with the live card, confirm the badge flips to Premium and filters
      unlock without any manual database edit.
- [ ] Cancel from the billing portal and confirm the plan returns to Free.
