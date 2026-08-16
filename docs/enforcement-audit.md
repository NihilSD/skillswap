# Enforcement audit

Stage 9 asks one question of every plan-gated feature: **is the limit actually
enforced in the database, or only in the UI?** A disabled button is a courtesy,
not a control — anything gated only in React can be bypassed with a single
`fetch` against the Supabase REST API using the user's own anon-key session.

Every row below was tested by connecting to Postgres directly as the
`authenticated` role with the user's id in `request.jwt.claim.sub` — the same
privileges a hand-crafted API call or Studio's SQL editor would have.

| Feature | Enforced by | Bypassable from the client? |
| --- | --- | --- |
| Max skill listings (1 free / 3 premium) | `can_add_skill_listing()` + `BEFORE INSERT` trigger → `SS001` | No |
| Max **active** listings | `can_activate_skill_listing()` + `BEFORE INSERT/UPDATE` triggers → `SS002` | No |
| Listing ownership transfer | `BEFORE UPDATE` trigger → `SS005` | No |
| Browse filters (Premium only) | `discover_listings()` drops the filter args when the caller is not premium | No |
| Swap requests per day (1 / 3) | `can_send_swap_request()` + `BEFORE INSERT` trigger → `SS003` | No |
| Swap status transitions | `BEFORE UPDATE` trigger → `SS006` (recipient accepts/declines, either completes) | No |
| Messages per day (10 / unlimited) | `can_send_message()` + `BEFORE INSERT` trigger → `SS004` | No |
| Only rate a completed swap you were part of | RLS `INSERT` policy on `ratings` | No |
| One rating per rater per swap | `unique (swap_request_id, rater_user_id)` | No |
| Reading other people's requests / messages | RLS `SELECT` policies | No |
| Sending as another user | RLS `WITH CHECK (auth.uid() = sender_id / from_user_id)` | No |

## Issue found and fixed

**A user could grant themselves Premium.** The `profiles` update policy is
row-level: it says *you may update your own row*, with no way to express *but
not these columns*. A signed-in free user could therefore
`PATCH /rest/v1/profiles?id=eq.<self>` with `{"plan":"premium"}` and unlock every
paid limit — the limit functions read `profiles.plan`, so all four caps would
have lifted at once. Verified as exploitable before the fix.

Fixed by `..._protect_billing_columns.sql`: a `BEFORE UPDATE` trigger rejects
any client-side change to `plan`, `stripe_customer_id` or
`stripe_subscription_id` with `SS007`. The Stripe webhook still writes them
because it runs under the service role, where `auth.uid()` is null.

## Displayed numbers cannot drift

The `/profile` usage widget reads `get_plan_usage()`, which is composed of the
same functions the triggers call (`max_skill_listings`,
`swap_requests_sent_today`, `can_send_message`, and friends). There is no second
implementation of the counting logic to fall out of sync.

## Custom SQLSTATEs

| Code | Meaning |
| --- | --- |
| `SS001` | Too many skill listings in total |
| `SS002` | Too many active skill listings |
| `SS003` | Daily swap-request limit reached |
| `SS004` | Daily message limit reached |
| `SS005` | Attempt to change a listing's owner |
| `SS006` | Illegal swap-request status transition |
| `SS007` | Attempt to change billing columns from the client |

The UI maps these to plain-language copy with an upgrade link; anything else is
a genuine bug and is surfaced as-is.
