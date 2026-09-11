# SkillSwap plan limits

The single source of truth for what Free and Premium accounts can do.
Every limit below is enforced **in Postgres** (a function called from a
`BEFORE INSERT/UPDATE` trigger, or an RLS policy) — never only in the UI.

| Capability | Free | Premium |
| --- | --- | --- |
| Skills you can list (offered) | 1 total, 1 active | up to 3 total, up to 3 active |
| Browse marketplace with filters | No filters — plain list only | Full filtering (keyword, category, best match) |
| Swap requests sent per day | 1 | 3 |
| Private messages sent per day | 10 | Unlimited |

Notes:

- "Per day" means a rolling 24-hour window measured from `created_at`,
  not a calendar day.
- Enforcement functions: `can_add_skill_listing`, `can_activate_skill_listing`
  (Stage 3), `can_send_swap_request` (Stage 5), `can_send_message` (Stage 6).
- The `/profile` usage widget (Stage 9) reads from these same functions so the
  numbers shown can never drift from what is actually allowed.
