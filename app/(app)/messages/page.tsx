import type { Metadata } from 'next'
import { PageHeader } from '@/components/page-header'
import { EmptyState } from '@/components/empty-state'

export const metadata: Metadata = { title: 'Messages · SkillSwap' }

export default function MessagesPage() {
  return (
    <div className="container-page space-y-8">
      <PageHeader title="Messages" subtitle="Private, realtime conversations with your swap partners." />
      <EmptyState emoji="💬" title="Realtime chat arrives in Stage 6" body="Messaging is powered by Supabase Realtime and is built after swap requests." />
    </div>
  )
}
