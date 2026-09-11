/**
 * Minimal in-memory rate limiter for API routes.
 *
 * Deliberately simple: a fixed window per key held in the module scope. On a
 * serverless platform each instance keeps its own counter, so this is a
 * speed bump against a single client hammering an endpoint, not a distributed
 * quota. Swap the store for Redis/Upstash if you need a hard global limit.
 *
 * The real money-and-data protections do not depend on this: Stripe Checkout
 * sessions are harmless to create, and every data rule is enforced in Postgres.
 */
type Bucket = { count: number; resetAt: number }

const buckets = new Map<string, Bucket>()

/** Stops the map growing without bound on a long-lived instance. */
function sweep(now: number) {
  if (buckets.size < 5000) return
  for (const [key, bucket] of buckets) {
    if (bucket.resetAt <= now) buckets.delete(key)
  }
}

export type RateLimitResult = {
  allowed: boolean
  remaining: number
  retryAfterSeconds: number
}

export function rateLimit(
  key: string,
  { limit, windowSeconds }: { limit: number; windowSeconds: number }
): RateLimitResult {
  const now = Date.now()
  sweep(now)

  const existing = buckets.get(key)

  if (!existing || existing.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + windowSeconds * 1000 })
    return { allowed: true, remaining: limit - 1, retryAfterSeconds: 0 }
  }

  existing.count += 1

  if (existing.count > limit) {
    return {
      allowed: false,
      remaining: 0,
      retryAfterSeconds: Math.max(1, Math.ceil((existing.resetAt - now) / 1000)),
    }
  }

  return { allowed: true, remaining: limit - existing.count, retryAfterSeconds: 0 }
}

/** 429 response with the headers a well-behaved client expects. */
export function tooManyRequests(result: RateLimitResult) {
  return new Response(
    JSON.stringify({ error: 'Too many requests — please wait a moment and try again.' }),
    {
      status: 429,
      headers: {
        'Content-Type': 'application/json',
        'Retry-After': String(result.retryAfterSeconds),
      },
    }
  )
}
