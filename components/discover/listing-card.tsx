'use client'

import { useState } from 'react'
import { CATEGORY_EMOJI } from '@/lib/categories'
import { RequestModal } from '@/components/discover/request-modal'
import type { DiscoverListing } from '@/lib/database.types'
import type { Plan } from '@/lib/plan'

export function ListingCard({
  listing,
  showMatch,
  viewerId,
  plan,
}: {
  listing: DiscoverListing
  showMatch: boolean
  viewerId: string
  plan: Plan
}) {
  const [open, setOpen] = useState(false)

  return (
    <>
      <article className="card flex h-full flex-col p-5 transition duration-300 hover:-translate-y-1 hover:shadow-lift">
        <div className="flex items-start gap-3">
          <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-surface-2 text-xl">
            {listing.avatar_emoji}
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate font-semibold">{listing.name}</p>
            <p className="text-xs text-muted">Teaching</p>
          </div>
          {showMatch && listing.match_score > 0 && (
            <span className="chip border-brand-500/30 bg-brand-50 text-brand-600">
              <span aria-hidden>✨</span> Match
            </span>
          )}
        </div>

        <h3 className="mt-4 font-display text-lg font-bold leading-snug">{listing.title}</h3>

        <div className="mt-2">
          <span className="chip">
            <span aria-hidden>{CATEGORY_EMOJI[listing.category] ?? '✨'}</span>
            {listing.category}
          </span>
        </div>

        {listing.description && (
          <p className="mt-3 line-clamp-3 text-sm leading-relaxed text-muted">
            {listing.description}
          </p>
        )}

        <button type="button" onClick={() => setOpen(true)} className="btn-primary mt-5 w-full">
          Request to learn
        </button>
      </article>

      {open && (
        <RequestModal listing={listing} viewerId={viewerId} plan={plan} onClose={() => setOpen(false)} />
      )}
    </>
  )
}
