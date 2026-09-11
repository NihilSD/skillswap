import type { Metadata } from 'next'
import Link from 'next/link'
import { PageHeader } from '@/components/page-header'
import { EmptyState } from '@/components/empty-state'
import { RequestCard, type RequestView } from '@/components/matches/request-card'
import { requireProfile } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'
import {
  PUBLIC_PROFILE_COLUMNS,
  type PublicProfile,
  type SkillListing,
  type SwapRequest,
} from '@/lib/database.types'

export const metadata: Metadata = { title: 'Matches · SkillSwap' }

export default async function MatchesPage() {
  const { profile } = await requireProfile()
  const supabase = createClient()

  // RLS already limits this to requests the viewer is part of.
  const { data: requestRows } = await supabase
    .from('swap_requests')
    .select('*')
    .or(`from_user_id.eq.${profile.id},to_user_id.eq.${profile.id}`)
    .order('created_at', { ascending: false })

  const requests = (requestRows ?? []) as SwapRequest[]

  const otherIds = Array.from(
    new Set(requests.map((r) => (r.from_user_id === profile.id ? r.to_user_id : r.from_user_id)))
  )
  const listingIds = Array.from(new Set(requests.map((r) => r.offered_skill_listing_id)))

  const [{ data: peopleRows }, { data: listingRows }, { data: ratingRows }] = await Promise.all([
    otherIds.length
      ? supabase.from('profiles').select(PUBLIC_PROFILE_COLUMNS).in('id', otherIds)
      : Promise.resolve({ data: [] as PublicProfile[] }),
    listingIds.length
      ? supabase.from('skill_listings').select('*').in('id', listingIds)
      : Promise.resolve({ data: [] as SkillListing[] }),
    supabase.from('ratings').select('swap_request_id').eq('rater_user_id', profile.id),
  ])

  const people = new Map((peopleRows ?? []).map((p) => [p.id, p as PublicProfile]))
  const listings = new Map((listingRows ?? []).map((l) => [l.id, l as SkillListing]))
  const ratedSwapIds = new Set((ratingRows ?? []).map((r) => r.swap_request_id))

  function toView(request: SwapRequest): RequestView {
    const incoming = request.to_user_id === profile.id
    const otherId = incoming ? request.from_user_id : request.to_user_id
    const other = people.get(otherId)
    const listing = listings.get(request.offered_skill_listing_id)

    return {
      request,
      incoming,
      otherId,
      otherName: other?.name ?? 'Someone',
      otherEmoji: other?.avatar_emoji ?? '🙂',
      skillTitle: listing?.title ?? 'a skill',
      skillCategory: listing?.category ?? null,
      ratedByViewer: ratedSwapIds.has(request.id),
    }
  }

  const incoming = requests.filter((r) => r.to_user_id === profile.id).map(toView)
  const outgoing = requests.filter((r) => r.from_user_id === profile.id).map(toView)

  return (
    <div className="container-page space-y-8">
      <PageHeader
        title="Matches"
        subtitle="Swap requests you have received and sent."
        action={<Link href="/discover" className="btn-secondary">Find more skills</Link>}
      />

      <section className="space-y-4">
        <SectionHeading
          title="Incoming"
          count={incoming.filter((v) => v.request.status === 'pending').length}
          hint="waiting on you"
        />
        {incoming.length === 0 ? (
          <EmptyState
            emoji="📭"
            title="No incoming requests yet"
            body="When someone asks to learn one of your skills, it shows up here."
            action={<Link href="/profile" className="btn-secondary">Check your listings</Link>}
          />
        ) : (
          <ul className="space-y-3">
            {incoming.map((view) => (
              <li key={view.request.id}>
                <RequestCard view={view} viewerId={profile.id} />
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="space-y-4">
        <SectionHeading
          title="Sent"
          count={outgoing.filter((v) => v.request.status === 'pending').length}
          hint="awaiting a reply"
        />
        {outgoing.length === 0 ? (
          <EmptyState
            emoji="✈️"
            title="You have not sent any requests"
            body="Browse the marketplace and ask someone to teach you what they know."
            action={<Link href="/discover" className="btn-primary">Go to Discover</Link>}
          />
        ) : (
          <ul className="space-y-3">
            {outgoing.map((view) => (
              <li key={view.request.id}>
                <RequestCard view={view} viewerId={profile.id} />
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  )
}

function SectionHeading({ title, count, hint }: { title: string; count: number; hint: string }) {
  return (
    <div className="flex items-center gap-3">
      <h2 className="font-display text-lg font-bold">{title}</h2>
      {count > 0 && (
        <span className="chip border-brand-500/30 bg-brand-50 text-brand-600">
          {count} {hint}
        </span>
      )}
    </div>
  )
}
