/**
 * Free vs Premium limits — mirrors docs/plan-limits.md.
 *
 * These constants are for DISPLAY ONLY (labels, counters, disabled states).
 * The authoritative enforcement lives in Postgres functions and triggers, so a
 * crafted request or a direct API call hits the same wall as the UI does.
 */
export type Plan = 'free' | 'premium'

export const PLAN_LIMITS = {
  free: {
    listingsTotal: 1,
    listingsActive: 1,
    swapRequestsPerDay: 1,
    messagesPerDay: 10,
    filters: false,
  },
  premium: {
    listingsTotal: 3,
    listingsActive: 3,
    swapRequestsPerDay: 3,
    messagesPerDay: Infinity,
    filters: true,
  },
} as const

export function limitsFor(plan: Plan) {
  return PLAN_LIMITS[plan] ?? PLAN_LIMITS.free
}

/** Postgres SQLSTATE codes raised by the plan-limit triggers. */
export const PLAN_ERROR_CODES = {
  listingTotal: 'SS001',
  listingActive: 'SS002',
  swapRequestDaily: 'SS003',
  messageDaily: 'SS004',
} as const

export type PlanErrorCode = (typeof PLAN_ERROR_CODES)[keyof typeof PLAN_ERROR_CODES]

/**
 * Turns a raw Postgres error from a plan-limit trigger into copy we can show a
 * user, instead of leaking `new row violates ...` into the interface.
 */
export function planErrorMessage(
  error: { code?: string; message?: string } | null | undefined,
  plan: Plan
): string | null {
  if (!error?.code) return null
  const l = limitsFor(plan)

  switch (error.code) {
    case PLAN_ERROR_CODES.listingTotal:
      return plan === 'free'
        ? 'Free plan is limited to 1 skill listing — upgrade to list up to 3.'
        : 'Premium is limited to 3 skill listings. Delete one to add another.'
    case PLAN_ERROR_CODES.listingActive:
      return plan === 'free'
        ? 'Free plan is limited to 1 active skill — upgrade to list more.'
        : `Premium is limited to ${l.listingsActive} active skills.`
    case PLAN_ERROR_CODES.swapRequestDaily:
      return `You've used all ${l.swapRequestsPerDay} of today's swap requests.`
    case PLAN_ERROR_CODES.messageDaily:
      return 'Daily message limit reached — upgrade for unlimited messaging.'
    default:
      return null
  }
}

/** True when the error came from one of our plan-limit triggers. */
export function isPlanLimitError(error: { code?: string } | null | undefined): boolean {
  return !!error?.code && Object.values(PLAN_ERROR_CODES).includes(error.code as PlanErrorCode)
}
