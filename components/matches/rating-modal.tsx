'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Spinner } from '@/components/auth-form-parts'

/**
 * One rating per rater per swap — the unique constraint from Stage 1 is what
 * actually stops a double submission, so a duplicate is reported as "already
 * rated" rather than an error.
 */
export function RatingModal({
  swapRequestId,
  raterId,
  ratedId,
  ratedName,
  onDone,
  onClose,
}: {
  swapRequestId: string
  raterId: string
  ratedId: string
  ratedName: string
  onDone: () => void
  onClose: () => void
}) {
  const [score, setScore] = useState(5)
  const [hovered, setHovered] = useState(0)
  const [pending, setPending] = useState(false)
  const [error, setError] = useState<string | null>(null)

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

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setPending(true)
    setError(null)

    const comment = String(new FormData(event.currentTarget).get('comment') ?? '').trim()

    const { error } = await createClient().from('ratings').insert({
      swap_request_id: swapRequestId,
      rater_user_id: raterId,
      rated_user_id: ratedId,
      score,
      comment: comment || null,
    })

    setPending(false)

    if (error) {
      // 23505 = unique_violation: this rater already rated this swap.
      if (error.code === '23505') {
        onDone()
        return
      }
      setError(error.message)
      return
    }

    onDone()
  }

  const shown = hovered || score

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
        aria-labelledby="rating-title"
        className="card w-full max-w-md animate-fade-up rounded-b-none p-6 shadow-lift sm:rounded-3xl"
      >
        <h2 id="rating-title" className="font-display text-lg font-bold">
          How did the swap with {ratedName} go?
        </h2>
        <p className="mt-1 text-sm text-muted">Ratings are public and feed the leaderboard.</p>

        <form onSubmit={submit} className="mt-5 space-y-4">
          <div
            className="flex justify-center gap-1"
            onMouseLeave={() => setHovered(0)}
            role="radiogroup"
            aria-label="Score out of five"
          >
            {[1, 2, 3, 4, 5].map((value) => (
              <button
                key={value}
                type="button"
                role="radio"
                aria-checked={score === value}
                aria-label={`${value} star${value > 1 ? 's' : ''}`}
                onMouseEnter={() => setHovered(value)}
                onClick={() => setScore(value)}
                className={`text-3xl transition ${value <= shown ? 'scale-110' : 'opacity-30 grayscale'}`}
              >
                ⭐
              </button>
            ))}
          </div>

          <div>
            <label className="label" htmlFor="comment">Comment (optional)</label>
            <textarea
              id="comment"
              name="comment"
              className="textarea"
              maxLength={280}
              placeholder="What went well?"
            />
          </div>

          {error && <p className="alert-error" role="alert">{error}</p>}

          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <button type="button" onClick={onClose} className="btn-secondary">Later</button>
            <button type="submit" disabled={pending} className="btn-primary">
              {pending ? <><Spinner /> Submitting…</> : 'Submit rating'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
