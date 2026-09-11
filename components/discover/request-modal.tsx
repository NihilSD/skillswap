'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Spinner } from '@/components/auth-form-parts'
import { useCountdown } from '@/components/use-countdown'
import { CATEGORY_EMOJI } from '@/lib/categories'
import { PLAN_ERROR_CODES, planErrorMessage, type Plan } from '@/lib/plan'
import type { DiscoverListing } from '@/lib/database.types'

/**
 * Compose and send a swap request.
 *
 * `offered_skill_listing_id` is the teacher's listing — the offered skill this
 * request is about. The daily send limit is enforced by a BEFORE INSERT
 * trigger; when it fires (SS003) we look up when the oldest request in the
 * window ages out and show a live countdown instead of a generic error.
 */
export function RequestModal({
  listing,
  viewerId,
  plan,
  onClose,
}: {
  listing: DiscoverListing
  viewerId: string
  plan: Plan
  onClose: () => void
}) {
  const router = useRouter()
  const [pending, setPending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [limited, setLimited] = useState(false)
  const [resetAt, setResetAt] = useState<string | null>(null)
  const [sent, setSent] = useState(false)
  const countdown = useCountdown(resetAt)

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (event.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
    }
  }, [onClose])

  async function send(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError(null)
    setLimited(false)
    setPending(true)

    const supabase = createClient()
    const message = String(new FormData(event.currentTarget).get('message') ?? '').trim()

    const { error } = await supabase.from('swap_requests').insert({
      from_user_id: viewerId,
      to_user_id: listing.teacher_id,
      offered_skill_listing_id: listing.id,
      message: message || null,
    })

    if (error) {
      if (error.code === PLAN_ERROR_CODES.swapRequestDaily) {
        setLimited(true)
        const { data } = await supabase.rpc('swap_request_reset_at', { p_user_id: viewerId })
        setResetAt((data as string | null) ?? null)
      }
      setError(planErrorMessage(error, plan) ?? error.message)
      setPending(false)
      return
    }

    setSent(true)
    setPending(false)
    router.refresh()
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-ink/40 backdrop-blur-sm sm:items-center sm:p-6"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="request-title"
        className="card w-full max-w-lg animate-fade-up rounded-b-none p-6 shadow-lift sm:rounded-3xl"
      >
        <div className="flex items-start gap-3">
          <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-surface-2 text-2xl">
            {CATEGORY_EMOJI[listing.category] ?? '✨'}
          </span>
          <div className="min-w-0 flex-1">
            <h2 id="request-title" className="font-display text-lg font-bold">
              {sent ? 'Request sent' : `Request to learn ${listing.title}`}
            </h2>
            <p className="mt-0.5 text-sm text-muted">
              {listing.name} · {listing.category}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="grid h-9 w-9 shrink-0 place-items-center rounded-full text-muted transition hover:bg-surface-2 hover:text-ink"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" aria-hidden>
              <path d="M18 6 6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        {sent ? (
          <div className="mt-5 space-y-4">
            <p className="alert-success">
              <span aria-hidden>✓</span>
              <span>
                Your request is on its way to {listing.name}. You will see it under Matches.
              </span>
            </p>
            <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <button type="button" onClick={onClose} className="btn-secondary">Keep browsing</button>
              <Link href="/matches" className="btn-primary">View my matches</Link>
            </div>
          </div>
        ) : (
          <form onSubmit={send} className="mt-5 space-y-4">
            <div>
              <label className="label" htmlFor="swap-message">Your message</label>
              <textarea
                id="swap-message"
                name="message"
                className="textarea"
                maxLength={400}
                placeholder={`Hi ${listing.name}, I'd love to learn ${listing.title.toLowerCase()} — I can teach you something in return.`}
              />
            </div>

            {error && (
              <div className="alert-error" role="alert">
                <svg className="mt-0.5 shrink-0" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" aria-hidden>
                  <circle cx="12" cy="12" r="9" />
                  <path d="M12 8v5M12 16.5h.01" />
                </svg>
                <span>
                  {limited && countdown
                    ? `You've used ${plan === 'free' ? 'your free request' : 'all your requests'} for today — resets in ${countdown}.`
                    : error}
                  {limited && plan === 'free' && (
                    <>
                      {' '}
                      <Link href="/pricing" className="font-semibold underline underline-offset-2">
                        Upgrade for more
                      </Link>
                    </>
                  )}
                </span>
              </div>
            )}

            <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <button type="button" onClick={onClose} className="btn-secondary">Cancel</button>
              <button type="submit" disabled={pending || limited} className="btn-primary">
                {pending ? <><Spinner /> Sending…</> : 'Send request'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}
