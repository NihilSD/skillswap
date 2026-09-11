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

---

# Penetration test — results

A second, adversarial pass: every test run as the `authenticated` role with a
victim's id in `request.jwt.claim.sub`, i.e. exactly the privileges someone
holds with their own session token and `curl`.

## Findings and fixes

| # | Severity | Finding | Status |
| --- | --- | --- | --- |
| 1 | High | **Message forgery.** The `messages` UPDATE policy is row-level (`auth.uid() = receiver_id`), so a recipient could rewrite the `content` of a message sent to them. The row stayed attributed to the original sender — someone could fabricate what another member said ("I will pay you 50" → "…5000") and it would look authentic in the thread. | Fixed — `SS008` trigger makes a sent message immutable except for `read_at` |
| 2 | Medium | **Billing identifier disclosure.** The public-directory SELECT policy is `using (true)` over all columns, so any signed-in user could read every member's `stripe_customer_id` and `stripe_subscription_id`. | Fixed — table-level SELECT revoked and re-granted per column; the Stripe routes read the caller's own value through `my_stripe_customer_id()` |
| 3 | Medium | **No length limits on user text.** A 200 KB bio, a 5,000-character display name and a 1,000-character "emoji" were all accepted through the API. Storage abuse, and oversized values break every layout that renders them. | Fixed — CHECK constraints on profiles, listings, wanted skills, messages, requests and rating comments |
| 4 | Medium | **Open redirect.** `/signin?next=//evil.com` passed the `startsWith('/')` check, and a protocol-relative URL resolves to another origin — a phishing link that genuinely starts on our domain. | Fixed — `safeNext()` rejects `//` and `/\` prefixes |
| 5 | Low | **Swap request messages were editable after sending.** The sender could rewrite the message the recipient had already acted on. | Fixed — `SS006` on any post-send message change |
| 6 | Low | **Missing security headers.** No framing, MIME-sniffing, referrer or HSTS protection; `X-Powered-By` advertised the framework. | Fixed in `next.config.mjs` |
| 7 | Low | **Verbose webhook errors.** Signature failures returned Stripe's full diagnostic text to an unauthenticated caller. | Fixed — logged server-side, generic response |

## Tested and found sound

- **Privilege escalation** — self-upgrade to premium blocked twice over (trigger + no UPDATE privilege on the column)
- **Rating integrity** — cannot rate yourself, rate on someone else's behalf, rate a swap you were not part of, rate an incomplete swap, or delete/alter a rating written about you
- **IDOR** — cannot read other people's swap requests or messages, cannot re-address a message, cannot send as another user, cannot transfer a listing
- **Status tampering** — cannot accept your own request, cannot reverse a status, cannot complete a swap you are not part of
- **SQL injection** — `discover_listings` passes its arguments as parameters, never string-built SQL; `' or 1=1 --` returns normal results
- **Premium filter bypass** — filter arguments are dropped inside the function for free accounts
- **Secrets** — no `.env` files tracked in git; the service-role and Stripe secret keys appear in no client bundle
- **XSS** — the only `dangerouslySetInnerHTML` is a static theme script with no user input; all user text renders as React children
- **Auth boundaries** — all six protected routes redirect when signed out; both Stripe routes 401; the webhook rejects missing and forged signatures

## Follow-ups since closed

- **Rate limiting** — `/api/stripe/checkout` and `/api/stripe/portal` now allow
  5 requests per minute per user (`lib/rate-limit.ts`). It is an in-memory
  fixed window, so on serverless it is per instance: a speed bump, not a
  distributed quota. Nothing that matters depends on it, because the data rules
  are in Postgres.
- **Content-Security-Policy** — now a strict per-request policy built in
  `middleware.ts` with a nonce, `strict-dynamic`, and `connect-src` naming the
  Supabase HTTP and `wss://` origins so Realtime keeps working. Verified in a
  real browser: the theme script runs, React hydrates, the theme toggle works,
  and there are zero CSP violations or console errors.
- **Regression protection** — CI now fails the build if RLS is disabled on any
  table or if a user can change their own `plan`.

## Known, accepted, or deferred

- **Anyone can message anyone.** There is no requirement of an accepted swap
  before messaging, so unsolicited messages are possible (bounded to 10/day on
  free). This matches the spec; add a "must have an accepted swap" rule if spam
  becomes a problem.
- **`style-src` still allows `'unsafe-inline'`.** Tailwind and `next/font`
  emit inline styles with no nonce path. Inline *script* execution — the part
  that actually matters — is blocked.
- **Rate limiting is per instance.** See above; move it to Redis if you need a
  hard global limit.
- **Next.js 14.2.35 carries open advisories** (SSRF in Server Actions on custom
  servers, cache confusion, Server Function endpoint disclosure) that are only
  fixed in Next 16. The plan pinned Next 14; upgrading is a deliberate call.
