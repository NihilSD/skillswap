import type { Metadata } from 'next'
import { PageHeader } from '@/components/page-header'
import { PlanBadge } from '@/components/nav/plan-badge'
import { IdentityCard } from '@/components/profile/identity-card'
import { TeachSection } from '@/components/profile/teach-section'
import { LearnSection } from '@/components/profile/learn-section'
import { requireProfile } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'

export const metadata: Metadata = { title: 'Profile · SkillSwap' }

export default async function ProfilePage() {
  const { profile, email } = await requireProfile()
  const supabase = createClient()

  const [{ data: listings }, { data: wanted }] = await Promise.all([
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
  ])

  return (
    <div className="container-page space-y-8">
      <PageHeader
        title="Your profile"
        subtitle={email}
        action={<PlanBadge plan={profile.plan} className="px-3 py-1.5 text-xs" />}
      />

      <div className="grid gap-6 lg:grid-cols-[22rem_1fr] lg:items-start">
        <IdentityCard profile={profile} />

        <div className="space-y-6">
          <TeachSection profile={profile} initialListings={listings ?? []} />
          <LearnSection userId={profile.id} initialSkills={wanted ?? []} />
        </div>
      </div>
    </div>
  )
}
