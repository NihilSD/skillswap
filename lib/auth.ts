import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { PUBLIC_PROFILE_COLUMNS, type PublicProfile } from '@/lib/database.types'

/**
 * Returns the signed-in user and their profile, or redirects to /signin.
 *
 * Middleware already guards the protected route prefixes; this exists so page
 * code can rely on a non-null profile without repeating the null checks.
 */
export async function requireProfile(): Promise<{ userId: string; email: string; profile: PublicProfile }> {
  const supabase = createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/signin')

  const { data: profile } = await supabase
    .from('profiles')
    .select(PUBLIC_PROFILE_COLUMNS)
    .eq('id', user.id)
    .single()

  // The handle_new_user() trigger creates this row at signup; if it is missing
  // something is genuinely wrong, so bounce rather than render a broken page.
  if (!profile) redirect('/signin')

  return { userId: user.id, email: user.email ?? '', profile }
}
