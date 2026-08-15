'use client'

import { useEffect, useRef } from 'react'
import { CATEGORY_EMOJI } from '@/lib/categories'
import type { DiscoverListing } from '@/lib/database.types'

/**
 * Compose a swap request. The insert into swap_requests — and the daily send
 * limit that guards it — is wired up in Stage 5; for now the modal collects
 * the message and explains that sending is not live yet.
 */
export function RequestModal({
  listing,
  onClose,
}: {
  listing: DiscoverListing
  onClose: () => void
}) {
  const dialogRef = useRef<HTMLDivElement>(null)

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

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-ink/40 p-0 backdrop-blur-sm sm:items-center sm:p-6"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <div
        ref={dialogRef}
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
              Request to learn {listing.title}
            </h2>
            <p className="mt-0.5 text-sm text-muted">
              from {listing.name} · {listing.category}
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

        <form
          className="mt-5 space-y-4"
          onSubmit={(e) => {
            e.preventDefault()
          }}
        >
          <div>
            <label className="label" htmlFor="swap-message">Your message</label>
            <textarea
              id="swap-message"
              className="textarea"
              maxLength={400}
              placeholder={`Hi ${listing.name}, I'd love to learn ${listing.title.toLowerCase()} — I can teach you something in return.`}
            />
          </div>

          <p className="alert-info">
            <span aria-hidden>🚧</span>
            <span>Sending swap requests goes live in Stage 5, along with the daily limit.</span>
          </p>

          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <button type="button" onClick={onClose} className="btn-secondary">Cancel</button>
            <button type="submit" disabled className="btn-primary">Send request</button>
          </div>
        </form>
      </div>
    </div>
  )
}
