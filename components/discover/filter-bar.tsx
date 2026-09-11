'use client'

import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { useEffect, useState } from 'react'
import { CATEGORIES, CATEGORY_EMOJI } from '@/lib/categories'
import type { Plan } from '@/lib/plan'

/**
 * Free users see the real controls, disabled, with a clear explanation —
 * hiding them entirely would leave people guessing what Premium buys.
 * The controls are cosmetic either way: discover_listings() ignores filter
 * arguments for free accounts.
 */
export function FilterBar({
  plan,
  q,
  category,
  sort,
}: {
  plan: Plan
  q: string
  category: string
  sort: string
}) {
  const router = useRouter()
  const params = useSearchParams()
  const locked = plan !== 'premium'
  const [keyword, setKeyword] = useState(q)

  useEffect(() => setKeyword(q), [q])

  function apply(next: Record<string, string>) {
    const search = new URLSearchParams(params.toString())
    for (const [key, value] of Object.entries(next)) {
      if (value) search.set(key, value)
      else search.delete(key)
    }
    router.push(`/discover?${search.toString()}`)
  }

  const active = !locked && (q || category || sort === 'match')

  return (
    <div className={`card p-4 ${locked ? 'relative overflow-hidden' : ''}`}>
      <form
        onSubmit={(e) => {
          e.preventDefault()
          if (!locked) apply({ q: keyword })
        }}
        className={`grid gap-3 sm:grid-cols-[1fr_11rem_11rem_auto] ${locked ? 'pointer-events-none opacity-45' : ''}`}
        aria-hidden={locked}
      >
        <div className="relative">
          <svg className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-muted" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" aria-hidden>
            <circle cx="11" cy="11" r="7" />
            <path d="m20 20-3.5-3.5" />
          </svg>
          <input
            className="input pl-10"
            placeholder="Search skills, categories or people"
            aria-label="Search skills"
            value={keyword}
            disabled={locked}
            onChange={(e) => setKeyword(e.target.value)}
          />
        </div>

        <select
          className="input"
          aria-label="Filter by category"
          value={category}
          disabled={locked}
          onChange={(e) => apply({ category: e.target.value })}
        >
          <option value="">All categories</option>
          {CATEGORIES.map((c) => (
            <option key={c} value={c}>{CATEGORY_EMOJI[c]} {c}</option>
          ))}
        </select>

        <select
          className="input"
          aria-label="Sort listings"
          value={sort}
          disabled={locked}
          onChange={(e) => apply({ sort: e.target.value === 'match' ? 'match' : '' })}
        >
          <option value="newest">Newest first</option>
          <option value="match">Best match</option>
        </select>

        <div className="flex gap-2">
          <button type="submit" disabled={locked} className="btn-primary flex-1 sm:flex-none">
            Search
          </button>
          {active && (
            <Link href="/discover" className="btn-ghost">Clear</Link>
          )}
        </div>
      </form>

      {locked && (
        <div className="absolute inset-0 grid place-items-center bg-surface/70 px-4 backdrop-blur-[2px]">
          <Link
            href="/pricing"
            className="btn-secondary shadow-soft"
          >
            <span aria-hidden>🔒</span>
            Filters are a Premium feature
          </Link>
        </div>
      )}
    </div>
  )
}
