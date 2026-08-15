import type { Metadata } from 'next'
import { PageHeader } from '@/components/page-header'
import { EmptyState } from '@/components/empty-state'

export const metadata: Metadata = { title: 'Leaderboard · SkillSwap' }

export default function LeaderboardPage() {
  return (
    <div className="container-page space-y-8">
      <PageHeader title="Leaderboard" subtitle="Ranked by completed swaps and average rating." />
      <EmptyState emoji="🏆" title="The leaderboard arrives in Stage 7" body="It ranks members once swaps can be completed and rated." />
    </div>
  )
}
