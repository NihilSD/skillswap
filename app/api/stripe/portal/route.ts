import { NextResponse } from 'next/server'
import { getStripe } from '@/lib/stripe'
import { createClient } from '@/lib/supabase/server'
import { rateLimit, tooManyRequests } from '@/lib/rate-limit'

/** Opens the Stripe Customer Portal so a premium member can manage billing. */
export async function POST(request: Request) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Not signed in' }, { status: 401 })
  }

  // Creating Stripe sessions is cheap for us and costly for Stripe; cap it.
  const limit = rateLimit(`stripe:portal:${user.id}`, { limit: 5, windowSeconds: 60 })
  if (!limit.allowed) return tooManyRequests(limit)

  // Read only the caller's own customer id — the column itself is not
  // selectable from a user session.
  const { data: customerId } = await supabase.rpc('my_stripe_customer_id')

  if (!customerId) {
    return NextResponse.json({ error: 'No billing account yet' }, { status: 400 })
  }

  try {
    const stripe = getStripe()
    const session = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: `${new URL(request.url).origin}/profile`,
    })

    return NextResponse.json({ url: session.url })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Could not open the billing portal'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
