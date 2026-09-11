import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/lib/database.types'

/**
 * ⚠️ SERVICE ROLE CLIENT — BYPASSES ROW LEVEL SECURITY ENTIRELY. ⚠️
 *
 * This is the only place the service role key is read, and this module must
 * only ever be imported from trusted server code. Today that is exactly one
 * caller: the Stripe webhook route, which runs as Stripe rather than as a
 * signed-in user and therefore cannot satisfy any RLS policy.
 *
 * Do not import this from a Client Component, a shared util, or anything that
 * could end up in a browser bundle.
 */
export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!url || !serviceRoleKey) {
    throw new Error('Supabase service role credentials are not configured')
  }

  return createSupabaseClient<Database>(url, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  })
}
