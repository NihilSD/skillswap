import { NextResponse } from 'next/server'
import type Stripe from 'stripe'
import { getStripe } from '@/lib/stripe'
// ⚠️ The service role client is imported HERE AND NOWHERE ELSE. This route
// runs as Stripe, not as a signed-in user, so it cannot satisfy any RLS
// policy on profiles — it needs the key that bypasses RLS. Never import this
// module from anything that ships to the browser.
import { createAdminClient } from '@/lib/supabase/admin'

// The raw body is required for signature verification, so this route must not
// be statically analysed or cached.
export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export async function POST(request: Request) {
  const secret = process.env.STRIPE_WEBHOOK_SECRET
  if (!secret) {
    return NextResponse.json({ error: 'STRIPE_WEBHOOK_SECRET is not set' }, { status: 500 })
  }

  const signature = request.headers.get('stripe-signature')
  if (!signature) {
    return NextResponse.json({ error: 'Missing stripe-signature header' }, { status: 400 })
  }

  const stripe = getStripe()
  const body = await request.text()

  let event: Stripe.Event
  try {
    event = stripe.webhooks.constructEvent(body, signature, secret)
  } catch (error) {
    // Log the detail server-side; return nothing that helps someone probe the
    // endpoint (Stripe's own message is long and framework-revealing).
    console.error('Stripe webhook signature verification failed:', error)
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  const supabase = createAdminClient()

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object
        const userId =
          session.metadata?.supabase_user_id ?? session.client_reference_id ?? null

        if (!userId) {
          // Nothing to attach the subscription to — log and acknowledge so
          // Stripe does not retry forever.
          console.error('checkout.session.completed without a supabase_user_id')
          break
        }

        await supabase
          .from('profiles')
          .update({
            plan: 'premium',
            stripe_customer_id: asId(session.customer),
            stripe_subscription_id: asId(session.subscription),
          })
          .eq('id', userId)

        break
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object
        const userId = subscription.metadata?.supabase_user_id ?? null

        // Prefer the id we stamped on the subscription; fall back to matching
        // on the stored subscription id.
        const query = supabase
          .from('profiles')
          .update({ plan: 'free', stripe_subscription_id: null })

        if (userId) {
          await query.eq('id', userId)
        } else {
          await query.eq('stripe_subscription_id', subscription.id)
        }

        break
      }

      default:
        // Everything else is acknowledged and ignored.
        break
    }
  } catch (error) {
    console.error('Stripe webhook handler failed:', error)
    return NextResponse.json({ error: 'Webhook handler failed' }, { status: 500 })
  }

  return NextResponse.json({ received: true })
}

/** Stripe fields are `string | Expandable<T> | null`; we only want the id. */
function asId(value: string | { id: string } | null | undefined): string | null {
  if (!value) return null
  return typeof value === 'string' ? value : value.id
}
