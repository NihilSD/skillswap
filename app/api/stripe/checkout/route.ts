import { NextResponse } from 'next/server'
import { getStripe } from '@/lib/stripe'
import { createClient } from '@/lib/supabase/server'
import { rateLimit, tooManyRequests } from '@/lib/rate-limit'

/**
 * Creates a Stripe Checkout subscription session for the signed-in user.
 * The Supabase user id travels in metadata (and client_reference_id) so the
 * webhook can match the completed payment back to a profile.
 */
export async function POST(request: Request) {
  const supabase = createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Not signed in' }, { status: 401 })
  }

  // Creating Stripe sessions is cheap for us and costly for Stripe; cap it.
  const limit = rateLimit(`stripe:checkout:${user.id}`, { limit: 5, windowSeconds: 60 })
  if (!limit.allowed) return tooManyRequests(limit)

  const priceId = process.env.STRIPE_PREMIUM_PRICE_ID
  if (!priceId) {
    return NextResponse.json(
      { error: 'STRIPE_PREMIUM_PRICE_ID is not configured' },
      { status: 500 }
    )
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('plan')
    .eq('id', user.id)
    .single()

  // stripe_customer_id is not readable from a user session (the anon and
  // authenticated roles have no column privilege on it); this SECURITY
  // DEFINER function returns only the caller's own value.
  const { data: existingCustomerId } = await supabase.rpc('my_stripe_customer_id')

  if (profile?.plan === 'premium') {
    return NextResponse.json({ error: 'You are already on Premium' }, { status: 400 })
  }

  const origin = new URL(request.url).origin

  try {
    const stripe = getStripe()
    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      line_items: [{ price: priceId, quantity: 1 }],
      // Reuse the customer if we have already created one for this user.
      ...(existingCustomerId
        ? { customer: existingCustomerId }
        : { customer_email: user.email }),
      client_reference_id: user.id,
      metadata: { supabase_user_id: user.id },
      subscription_data: { metadata: { supabase_user_id: user.id } },
      success_url: `${origin}/profile?upgraded=1`,
      cancel_url: `${origin}/pricing?cancelled=1`,
      allow_promotion_codes: true,
    })

    return NextResponse.json({ url: session.url })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Could not start checkout'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
