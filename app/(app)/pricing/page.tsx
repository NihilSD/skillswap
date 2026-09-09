import type { Metadata } from 'next'
import { PageHeader } from '@/components/page-header'
import { PlanCards } from '@/components/pricing/plan-cards'
import { requireProfile } from '@/lib/auth'

export const metadata: Metadata = { title: 'Pricing · SkillSwap' }

export default async function PricingPage({
  searchParams,
}: {
  searchParams: Promise<{ cancelled?: string }>
}) {
  const params = await searchParams
  const { profile } = await requireProfile()

  return (
    <div className="container-page space-y-8">
      <PageHeader
        title="Plans & pricing"
        subtitle="Every limit below is enforced in the database, so the free tier is honest."
      />

      {params.cancelled && (
        <p className="alert-info" role="status">
          <span aria-hidden>↩︎</span>
          <span>Checkout cancelled — you are still on the Free plan.</span>
        </p>
      )}

      <PlanCards plan={profile.plan} />

      <div className="card p-6">
        <h2 className="font-display text-lg font-bold">Where the limits actually live</h2>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted">
          Skill caps, browse filters, daily swap requests and daily messages are all
          enforced by Postgres functions and triggers, not by a disabled button. Your
          plan changes what the database allows the moment your subscription updates.
        </p>
      </div>
    </div>
  )
}
