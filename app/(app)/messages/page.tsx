import type { Metadata } from 'next'
import Link from 'next/link'
import { PageHeader } from '@/components/page-header'
import { EmptyState } from '@/components/empty-state'
import { MessagesClient, type Conversation } from '@/components/messages/messages-client'
import { requireProfile } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'
import {
  PUBLIC_PROFILE_COLUMNS,
  type Message,
  type PublicProfile,
} from '@/lib/database.types'

export const metadata: Metadata = { title: 'Messages · SkillSwap' }

export default async function MessagesPage({
  searchParams,
}: {
  searchParams: { with?: string }
}) {
  const { profile } = await requireProfile()
  const supabase = createClient()

  // RLS keeps this to messages the viewer sent or received.
  const { data: messageRows } = await supabase
    .from('messages')
    .select('*')
    .order('created_at', { ascending: true })

  const messages = (messageRows ?? []) as Message[]

  // Conversations are the distinct set of people involved with the viewer.
  const partnerIds = Array.from(
    new Set(
      messages.map((m) => (m.sender_id === profile.id ? m.receiver_id : m.sender_id))
    )
  )

  // Someone arriving from "Message X" on an accepted match has no thread yet.
  const requested = searchParams.with
  if (requested && requested !== profile.id && !partnerIds.includes(requested)) {
    partnerIds.push(requested)
  }

  const { data: peopleRows } = partnerIds.length
    ? await supabase.from('profiles').select(PUBLIC_PROFILE_COLUMNS).in('id', partnerIds)
    : { data: [] as PublicProfile[] }

  const people = new Map((peopleRows ?? []).map((p) => [p.id, p as PublicProfile]))

  const conversations: Conversation[] = partnerIds
    .filter((id) => people.has(id))
    .map((id) => {
      const thread = messages.filter(
        (m) => m.sender_id === id || m.receiver_id === id
      )
      const last = thread[thread.length - 1]
      const person = people.get(id)!

      return {
        partnerId: id,
        partnerName: person.name,
        partnerEmoji: person.avatar_emoji,
        lastMessage: last?.content ?? null,
        lastAt: last?.created_at ?? null,
        unread: thread.some((m) => m.receiver_id === profile.id && !m.read_at),
      }
    })
    .sort((a, b) => (b.lastAt ?? '').localeCompare(a.lastAt ?? ''))

  // Usage counters come from the same functions the trigger enforces with, so
  // the number shown can never drift from what is actually allowed.
  const [{ data: sentToday }, { data: maxPerDay }, { data: resetAt }] = await Promise.all([
    supabase.rpc('messages_sent_today', { p_user_id: profile.id }),
    supabase.rpc('max_messages_per_day', { p_user_id: profile.id }),
    supabase.rpc('message_reset_at', { p_user_id: profile.id }),
  ])

  const activeId =
    searchParams.with && conversations.some((c) => c.partnerId === searchParams.with)
      ? searchParams.with
      : conversations[0]?.partnerId ?? null

  return (
    <div className="container-page space-y-6">
      <PageHeader
        title="Messages"
        subtitle={
          maxPerDay == null
            ? 'Unlimited messaging on Premium.'
            : `${sentToday ?? 0} of ${maxPerDay} messages sent today.`
        }
        action={<Link href="/matches" className="btn-secondary">Your matches</Link>}
      />

      {conversations.length === 0 ? (
        <EmptyState
          emoji="💬"
          title="No conversations yet"
          body="Once a swap request is accepted you can message each other here. Realtime — no refreshing."
          action={<Link href="/discover" className="btn-primary">Find someone to swap with</Link>}
        />
      ) : (
        <MessagesClient
          viewerId={profile.id}
          plan={profile.plan}
          conversations={conversations}
          initialMessages={messages}
          initialActiveId={activeId}
          sentToday={sentToday ?? 0}
          maxPerDay={maxPerDay ?? null}
          resetAt={(resetAt as string | null) ?? null}
        />
      )}
    </div>
  )
}
