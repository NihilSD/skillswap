package com.skillswap.app.data

/**
 * Display-only mirror of docs/plan-limits.md, identical to lib/plan.ts on the
 * web. The authority is Postgres: these constants only drive labels and
 * counters, never a decision about what is allowed.
 */
object PlanLimits {
    const val FREE_LISTINGS = 1
    const val PREMIUM_LISTINGS = 3
    const val FREE_REQUESTS_PER_DAY = 1
    const val PREMIUM_REQUESTS_PER_DAY = 3
    const val FREE_MESSAGES_PER_DAY = 10
}

/** Custom SQLSTATEs raised by the plan-limit and integrity triggers. */
object PlanError {
    const val LISTING_TOTAL = "SS001"
    const val LISTING_ACTIVE = "SS002"
    const val SWAP_REQUEST_DAILY = "SS003"
    const val MESSAGE_DAILY = "SS004"
    const val LISTING_OWNER = "SS005"
    const val SWAP_TRANSITION = "SS006"
    const val BILLING_COLUMNS = "SS007"
    const val MESSAGE_IMMUTABLE = "SS008"

    /**
     * Turns a Postgres error into copy a person can act on. Anything that is
     * not one of our codes is a genuine bug and is surfaced as-is.
     */
    fun friendlyMessage(raw: String?, isPremium: Boolean): String? {
        if (raw == null) return null
        return when {
            raw.contains(LISTING_TOTAL) || raw.contains("listing(s) allowed") ->
                if (isPremium) "Premium is limited to 3 skill listings. Delete one to add another."
                else "Free plan is limited to 1 skill listing — upgrade to list up to 3."
            raw.contains(LISTING_ACTIVE) || raw.contains("active listing(s)") ->
                if (isPremium) "Premium is limited to 3 active skills."
                else "Free plan is limited to 1 active skill — upgrade to list more."
            raw.contains(SWAP_REQUEST_DAILY) || raw.contains("swap request(s) per day") ->
                "You have used all of today's swap requests."
            raw.contains(MESSAGE_DAILY) || raw.contains("messages per day") ->
                "Daily message limit reached — upgrade for unlimited messaging."
            raw.contains(BILLING_COLUMNS) ->
                "Your plan is set by billing, not from the app."
            else -> null
        }
    }
}
