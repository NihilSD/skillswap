import type { Metadata } from 'next'
import { PageHeader } from '@/components/page-header'
import { EmptyState } from '@/components/empty-state'

export const metadata: Metadata = { title: 'Discover · SkillSwap' }

export default function DiscoverPage() {
  return (
    <div className="container-page space-y-8">
      <PageHeader title="Discover" subtitle="Find someone teaching what you want to learn." />
      <EmptyState
        emoji="🔍"
        title="The marketplace lands in Stage 4"
        body="Browsing, filters and swap requests are built next. Add a skill to your profile so people can find you when it opens."
      />
    </div>
  )
}
