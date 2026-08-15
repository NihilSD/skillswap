# SkillSwap

A marketplace for trading skills: list what you can teach, find someone teaching
what you want to learn, swap, chat in realtime, and rate each other.

**Stack:** Next.js 14 (App Router) · TypeScript · Tailwind CSS · Supabase
(Postgres + Auth + Realtime) · Stripe (Premium billing)

Plan limits live in [`docs/plan-limits.md`](docs/plan-limits.md) and are enforced
in Postgres, not just in the UI.

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
```

## Build stages

- [x] **Stage 0** — Scaffold, Supabase clients, design system, landing page
- [ ] Stage 1 — Database schema + RLS migration
- [ ] Stage 2 — Auth (sign up / sign in)
- [ ] Stage 3 — Profile & skill listings
- [ ] Stage 4 — Discover / marketplace
- [ ] Stage 5 — Swap requests & ratings
- [ ] Stage 6 — Realtime messaging
- [ ] Stage 7 — Leaderboard
- [ ] Stage 8 — Stripe billing
- [ ] Stage 9 — Polish & deployment checklist
