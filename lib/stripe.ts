import Stripe from 'stripe'

/**
 * Server-side Stripe client. Never import this from a Client Component — the
 * secret key must not reach the browser.
 */
export function getStripe(): Stripe {
  const key = process.env.STRIPE_SECRET_KEY
  if (!key) throw new Error('STRIPE_SECRET_KEY is not set')
  // Pin nothing: the SDK's default pinned version matches the installed major.
  return new Stripe(key)
}

export const PREMIUM_PRICE_LABEL = '$9'
