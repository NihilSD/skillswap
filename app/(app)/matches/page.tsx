import type { Metadata } from 'next'
import { PageHeader } from '@/components/page-header'
import { EmptyState } from '@/components/empty-state'

export const metadata: Metadata = { title: 'Matches · SkillSwap' }

export default function MatchesPage() {
  return (
    <div className="container-page space-y-8">
      <PageHeader title="Matches" subtitle="Swap requests you have sent and received." />
      <EmptyState emoji="🤝" title="Swap requests arrive in Stage 5" body="Accepting, completing and rating swaps is built in a later stage." />
    </div>
  )
}
