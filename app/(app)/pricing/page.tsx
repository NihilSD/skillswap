import type { Metadata } from 'next'
import { PageHeader } from '@/components/page-header'
import { EmptyState } from '@/components/empty-state'

export const metadata: Metadata = { title: 'Pricing · SkillSwap' }

export default function PricingPage() {
  return (
    <div className="container-page space-y-8">
      <PageHeader title="Plans & pricing" subtitle="Upgrade for more skills, filters and unlimited messaging." />
      <EmptyState emoji="💳" title="Stripe checkout arrives in Stage 8" body="The plan comparison and upgrade flow are wired up with Stripe in a later stage." />
    </div>
  )
}
