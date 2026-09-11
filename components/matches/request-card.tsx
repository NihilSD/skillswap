'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Spinner } from '@/components/auth-form-parts'
import { RatingModal } from '@/components/matches/rating-modal'
import { CATEGORY_EMOJI } from '@/lib/categories'
import type { SwapRequest, SwapStatus } from '@/lib/database.types'

export type RequestView = {
  request: SwapRequest
  incoming: boolean
  otherId: string
  otherName: string
  otherEmoji: string
  skillTitle: string
  skillCategory: string | null
  ratedByViewer: boolean
}

const STATUS_STYLES: Record<SwapStatus, string> = {
  pending: 'border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-300',
  accepted: 'border-brand-500/30 bg-brand-50 text-brand-600',
  declined: 'border-line bg-surface-2 text-muted',
  completed: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300',
}

const STATUS_LABEL: Record<SwapStatus, string> = {
  pending: 'Pending',
  accepted: 'Accepted',
  declined: 'Declined',
  completed: 'Completed',
}

export function RequestCard({ view, viewerId }: { view: RequestView; viewerId: string }) {
  const router = useRouter()
  const { request, incoming } = view
  const [status, setStatus] = useState<SwapStatus>(request.status)
  const [pending, setPending] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [rating, setRating] = useState(false)
  const [rated, setRated] = useState(view.ratedByViewer)

  async function setRequestStatus(next: SwapStatus) {
    setError(null)
    setPending(next)

    const { error } = await createClient()
      .from('swap_requests')
      .update({ status: next })
      .eq('id', request.id)

    setPending(null)

    if (error) {
      setError(error.message)
      return
    }

    setStatus(next)
    // Completing a swap unlocks the rating step for whoever pressed it.
    if (next === 'completed') setRating(true)
    router.refresh()
  }

  return (
    <>
      <article className="card p-5">
        <div className="flex flex-wrap items-start gap-4">
          <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-surface-2 text-xl">
            {view.otherEmoji}
          </span>

          <div className="min-w-0 flex-1">
            <p className="text-sm leading-relaxed">
              <strong className="font-semibold">{view.otherName}</strong>{' '}
              {incoming ? 'wants to learn' : '— you asked to learn'}{' '}
              <strong className="font-semibold">{view.skillTitle}</strong>
              {view.skillCategory && (
                <span className="ml-2 chip">
                  <span aria-hidden>{CATEGORY_EMOJI[view.skillCategory] ?? '✨'}</span>
                  {view.skillCategory}
                </span>
              )}
            </p>

            {request.message && (
              <p className="mt-2 rounded-xl border border-line bg-surface-2 px-3.5 py-2.5 text-sm leading-relaxed text-muted">
                “{request.message}”
              </p>
            )}

            <p className="mt-2 text-xs text-muted">
              {new Date(request.created_at).toLocaleDateString(undefined, {
                day: 'numeric',
                month: 'short',
                year: 'numeric',
              })}
            </p>
          </div>

          <span className={`chip ${STATUS_STYLES[status]}`}>{STATUS_LABEL[status]}</span>
        </div>

        {error && <p className="alert-error mt-4" role="alert">{error}</p>}

        <div className="mt-4 flex flex-wrap gap-2">
          {status === 'pending' && incoming && (
            <>
              <button
                type="button"
                onClick={() => setRequestStatus('accepted')}
                disabled={!!pending}
                className="btn-primary"
              >
                {pending === 'accepted' ? <><Spinner /> Accepting…</> : 'Accept'}
              </button>
              <button
                type="button"
                onClick={() => setRequestStatus('declined')}
                disabled={!!pending}
                className="btn-secondary"
              >
                {pending === 'declined' ? <><Spinner /> Declining…</> : 'Decline'}
              </button>
            </>
          )}

          {status === 'pending' && !incoming && (
            <p className="text-sm text-muted">Waiting for {view.otherName} to reply.</p>
          )}

          {status === 'accepted' && (
            <>
              <button
                type="button"
                onClick={() => setRequestStatus('completed')}
                disabled={!!pending}
                className="btn-primary"
              >
                {pending === 'completed' ? <><Spinner /> Saving…</> : 'Mark as completed'}
              </button>
              <Link href={`/messages?with=${view.otherId}`} className="btn-secondary">
                Message {view.otherName.split(' ')[0]}
              </Link>
            </>
          )}

          {status === 'completed' && (
            rated ? (
              <p className="text-sm text-muted">
                <span aria-hidden>⭐</span> You rated {view.otherName} for this swap.
              </p>
            ) : (
              <button type="button" onClick={() => setRating(true)} className="btn-primary">
                Rate {view.otherName.split(' ')[0]}
              </button>
            )
          )}

          {status === 'declined' && (
            <p className="text-sm text-muted">This request was declined.</p>
          )}
        </div>
      </article>

      {rating && !rated && (
        <RatingModal
          swapRequestId={request.id}
          raterId={viewerId}
          ratedId={view.otherId}
          ratedName={view.otherName}
          onDone={() => {
            setRated(true)
            setRating(false)
            router.refresh()
          }}
          onClose={() => setRating(false)}
        />
      )}
    </>
  )
}
