import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import type { Database } from '@/lib/database.types'

/**
 * Supabase client for Server Components, Server Actions and Route Handlers.
 * Reads/writes the auth session through Next's cookie store.
 *
 * Async since Next 15: `cookies()` returns a promise, so every caller must
 * await this factory.
 */
export async function createClient() {
  const cookieStore = await cookies()

  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options)
            })
          } catch {
            // Called from a Server Component — the session is refreshed in
            // middleware.ts instead, so this can be safely ignored.
          }
        },
      },
    }
  )
}
