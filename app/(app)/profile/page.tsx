import type { Metadata } from 'next'
import type { PlanUsage } from '@/lib/database.types'
import { PageHeader } from '@/components/page-header'
import { PlanBadge } from '@/components/nav/plan-badge'
import { IdentityCard } from '@/components/profile/identity-card'
import { TeachSection } from '@/components/profile/teach-section'
import { LearnSection } from '@/components/profile/learn-section'
import { UsageWidget } from '@/components/profile/usage-widget'
import { BillingButton } from '@/components/profile/billing-button'
import { requireProfile } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'

export const metadata: Metadata = { title: 'Profile · SkillSwap' }

export default async function ProfilePage({
  searchParams,
}: {
  searchParams: Promise<{ upgraded?: string }>
}) {
  const params = await searchParams
  const { profile, email } = await requireProfile()
  const supabase = await createClient()

  const [{ data: listings }, { data: wanted }, { data: usageRows }] = await Promise.all([
    supabase
      .from('skill_listings')
      .select('*')
      .eq('user_id', profile.id)
      .order('created_at', { ascending: true }),
    supabase
      .from('wanted_skills')
      .select('*')
      .eq('user_id', profile.id)
      .order('created_at', { ascending: true }),
    supabase.rpc('get_plan_usage', { p_user_id: profile.id }),
  ])

  const usage = ((usageRows ?? []) as PlanUsage[])[0] ?? null

  return (
    <div className="container-page space-y-8">
      <PageHeader
        title="Your profile"
        subtitle={email}
        action={<PlanBadge plan={profile.plan} className="px-3 py-1.5 text-xs" />}
      />

      {params.upgraded && (
        <p className="alert-success" role="status">
          <span aria-hidden>🎉</span>
          <span>
            Welcome to Premium — your new limits are live. If the badge still says Free,
            give the Stripe webhook a second and refresh.
          </span>
        </p>
      )}

      {usage && <UsageWidget usage={usage} />}

      <div className="grid gap-6 lg:grid-cols-[22rem_1fr] lg:items-start">
        <div className="space-y-6 lg:sticky lg:top-24">
          <IdentityCard profile={profile} />
          {profile.plan === 'premium' && (
            <div className="card p-6">
              <h2 className="font-display text-lg font-bold">Billing</h2>
              <p className="mb-4 mt-1 text-sm text-muted">
                Update your card or cancel your subscription in Stripe.
              </p>
              <BillingButton />
            </div>
          )}
        </div>

        <div className="space-y-6">
          <TeachSection profile={profile} initialListings={listings ?? []} />
          <LearnSection userId={profile.id} initialSkills={wanted ?? []} />
        </div>
      </div>
    </div>
  )
}
