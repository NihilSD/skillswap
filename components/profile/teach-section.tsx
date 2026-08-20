'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Spinner } from '@/components/auth-form-parts'
import { CATEGORIES, CATEGORY_EMOJI } from '@/lib/categories'
import { limitsFor, planErrorMessage, isPlanLimitError } from '@/lib/plan'
import type { PublicProfile, SkillListing } from '@/lib/database.types'

export function TeachSection({
  profile,
  initialListings,
}: {
  profile: PublicProfile
  initialListings: SkillListing[]
}) {
  const router = useRouter()
  const [listings, setListings] = useState(initialListings)
  const [adding, setAdding] = useState(false)
  const [pending, setPending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [limitHit, setLimitHit] = useState(false)

  const limits = limitsFor(profile.plan)
  const activeCount = listings.filter((l) => l.active).length
  const atTotalCap = listings.length >= limits.listingsTotal

  /**
   * Surfaces the Postgres trigger's plan-limit error as readable copy. Any
   * other error is shown verbatim — those are genuine bugs, not policy.
   */
  function handleError(err: { code?: string; message?: string } | null) {
    if (!err) return false
    const friendly = planErrorMessage(err, profile.plan)
    setLimitHit(isPlanLimitError(err))
    setError(friendly ?? err.message ?? 'Something went wrong.')
    return true
  }

  async function addListing(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError(null)
    setLimitHit(false)

    const form = new FormData(event.currentTarget)
    const title = String(form.get('title')).trim()
    const category = String(form.get('category'))
    const description = String(form.get('description')).trim()

    if (title.length < 2) {
      setError('Give your skill a name.')
      return
    }

    setPending(true)
    const { data, error } = await createClient()
      .from('skill_listings')
      .insert({ user_id: profile.id, title, category, description })
      .select()
      .single()
    setPending(false)

    if (handleError(error)) return

    setListings((prev) => [...prev, data as SkillListing])
    setAdding(false)
    router.refresh()
  }

  async function toggleActive(listing: SkillListing) {
    setError(null)
    setLimitHit(false)

    const next = !listing.active
    const { error } = await createClient()
      .from('skill_listings')
      .update({ active: next })
      .eq('id', listing.id)

    if (handleError(error)) return

    setListings((prev) => prev.map((l) => (l.id === listing.id ? { ...l, active: next } : l)))
    router.refresh()
  }

  async function remove(listing: SkillListing) {
    setError(null)
    setLimitHit(false)

    const { error } = await createClient().from('skill_listings').delete().eq('id', listing.id)
    if (handleError(error)) return

    setListings((prev) => prev.filter((l) => l.id !== listing.id))
    router.refresh()
  }

  return (
    <section className="card p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="font-display text-lg font-bold">Skills I can teach</h2>
          <p className="mt-1 text-sm text-muted">
            {listings.length} of {limits.listingsTotal} listed · {activeCount} of{' '}
            {limits.listingsActive} active
          </p>
        </div>

        {!adding && (
          <button
            type="button"
            onClick={() => {
              setError(null)
              setLimitHit(false)
              setAdding(true)
            }}
            className="btn-secondary"
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" aria-hidden>
              <path d="M12 5v14M5 12h14" />
            </svg>
            Add a skill
          </button>
        )}
      </div>

      {/* Usage meter — mirrors what the database will actually allow. */}
      <div className="mt-4 flex gap-1.5" aria-hidden>
        {Array.from({ length: limits.listingsTotal }).map((_, i) => (
          <span
            key={i}
            className={`h-1.5 flex-1 rounded-full ${i < listings.length ? 'bg-brand-500' : 'bg-line'}`}
          />
        ))}
      </div>

      {error && (
        <div className="alert-error mt-4" role="alert">
          <svg className="mt-0.5 shrink-0" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" aria-hidden>
            <circle cx="12" cy="12" r="9" />
            <path d="M12 8v5M12 16.5h.01" />
          </svg>
          <span>
            {error}
            {limitHit && profile.plan === 'free' && (
              <>
                {' '}
                <Link href="/pricing" className="font-semibold underline underline-offset-2">
                  See Premium
                </Link>
              </>
            )}
          </span>
        </div>
      )}

      {adding && (
        <form onSubmit={addListing} className="mt-5 space-y-4 rounded-2xl border border-line bg-surface-2 p-5">
          <div className="grid gap-4 sm:grid-cols-[1fr_12rem]">
            <div>
              <label className="label" htmlFor="title">Skill</label>
              <input id="title" name="title" className="input" placeholder="Fingerstyle guitar" maxLength={80} required />
            </div>
            <div>
              <label className="label" htmlFor="category">Category</label>
              <select id="category" name="category" className="input" defaultValue="Music">
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>{CATEGORY_EMOJI[c]} {c}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="label" htmlFor="description">What will you teach?</label>
            <textarea
              id="description"
              name="description"
              className="textarea"
              maxLength={400}
              placeholder="An hour a week, beginner friendly, bring your own guitar."
            />
          </div>

          <div className="flex flex-wrap gap-2">
            <button type="submit" disabled={pending} className="btn-primary">
              {pending ? <><Spinner /> Adding…</> : 'Add skill'}
            </button>
            <button type="button" onClick={() => setAdding(false)} className="btn-ghost">
              Cancel
            </button>
          </div>

          {atTotalCap && (
            <p className="text-xs text-muted">
              Heads up: you are at your plan&apos;s limit of {limits.listingsTotal}
              {limits.listingsTotal === 1 ? ' skill' : ' skills'}, so this will be rejected by the
              database until you {profile.plan === 'free' ? 'upgrade' : 'remove one'}.
            </p>
          )}
        </form>
      )}

      <ul className="mt-5 space-y-3">
        {listings.length === 0 && !adding && (
          <li className="rounded-2xl border border-dashed border-line px-5 py-10 text-center">
            <p className="text-2xl">🎯</p>
            <p className="mt-2 font-semibold">No skills listed yet</p>
            <p className="mt-1 text-sm text-muted">Add the first thing you could teach someone.</p>
            <button type="button" onClick={() => setAdding(true)} className="btn-primary mt-5">
              Add a skill
            </button>
          </li>
        )}

        {listings.map((listing) => (
          <li
            key={listing.id}
            className={`rounded-2xl border p-4 transition ${
              listing.active ? 'border-line bg-surface' : 'border-dashed border-line bg-surface-2/60'
            }`}
          >
            <div className="flex flex-wrap items-start gap-3">
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-surface-2 text-lg">
                {CATEGORY_EMOJI[listing.category] ?? '✨'}
              </span>

              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="font-display font-bold">{listing.title}</p>
                  <span className="chip">{listing.category}</span>
                  {!listing.active && <span className="chip">Hidden</span>}
                </div>
                {listing.description && (
                  <p className="mt-1.5 text-sm leading-relaxed text-muted">{listing.description}</p>
                )}
              </div>

              <div className="flex w-full items-center justify-end gap-1 sm:w-auto">
                <button
                  type="button"
                  onClick={() => toggleActive(listing)}
                  role="switch"
                  aria-checked={listing.active}
                  aria-label={listing.active ? `Hide ${listing.title}` : `Show ${listing.title}`}
                  className={`relative h-6 w-11 shrink-0 rounded-full transition ${
                    listing.active ? 'bg-brand-500' : 'bg-line'
                  }`}
                >
                  <span
                    className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all ${
                      listing.active ? 'left-[1.375rem]' : 'left-0.5'
                    }`}
                  />
                </button>

                <button
                  type="button"
                  onClick={() => remove(listing)}
                  aria-label={`Delete ${listing.title}`}
                  className="grid h-9 w-9 place-items-center rounded-full text-muted transition hover:bg-red-500/10 hover:text-red-600"
                >
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                    <path d="M3 6h18M8 6V4h8v2M6 6l1 14h10l1-14" />
                  </svg>
                </button>
              </div>
            </div>
          </li>
        ))}
      </ul>
    </section>
  )
}
