'use client'

import { useState } from 'react'
import { Spinner } from '@/components/auth-form-parts'
import type { Plan } from '@/lib/plan'

const FREE_FEATURES: [string, boolean][] = [
  ['1 skill listed, 1 active', true],
  ['Browse the full marketplace', true],
  ['Search, category and best-match filters', false],
  ['1 swap request per day', true],
  ['10 messages per day', true],
]

const PREMIUM_FEATURES: [string, boolean][] = [
  ['Up to 3 skills, all active at once', true],
  ['Keyword, category and best-match filters', true],
  ['3 swap requests per day', true],
  ['Unlimited messages', true],
  ['Cancel any time from the billing portal', true],
]

export function PlanCards({ plan }: { plan: Plan }) {
  const [pending, setPending] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function upgrade() {
    setPending(true)
    setError(null)

    try {
      const response = await fetch('/api/stripe/checkout', { method: 'POST' })
      const body = await response.json()

      if (!response.ok) throw new Error(body.error ?? 'Could not start checkout')

      window.location.href = body.url
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not start checkout')
      setPending(false)
    }
  }

  return (
    <>
      {error && <p className="alert-error" role="alert">{error}</p>}

      <div className="grid gap-5 md:grid-cols-2">
        <section className={`card p-7 ${plan === 'free' ? 'ring-1 ring-brand-500/40' : ''}`}>
          <div className="flex items-center justify-between">
            <h2 className="font-display text-xl font-bold">Free</h2>
            {plan === 'free' && <span className="chip border-brand-500/30 text-brand-600">Your plan</span>}
          </div>
          <p className="mt-1 text-sm text-muted">Everything you need for your first swap.</p>
          <p className="mt-6 font-display text-4xl font-extrabold">$0</p>
          <ul className="mt-6 space-y-3 text-sm">
            {FREE_FEATURES.map(([label, included]) => (
              <Feature key={label} included={included}>{label}</Feature>
            ))}
          </ul>
        </section>

        <section className="card relative overflow-hidden p-7 ring-1 ring-brand-500/40">
          <div className="aurora right-[-4rem] top-[-6rem] h-56 w-56 bg-brand-500/40" aria-hidden />
          <div className="relative">
            <div className="flex items-center justify-between">
              <h2 className="font-display text-xl font-bold">Premium</h2>
              <span className="chip border-brand-500/30 bg-brand-50 text-brand-600">
                {plan === 'premium' ? 'Your plan' : 'Most popular'}
              </span>
            </div>
            <p className="mt-1 text-sm text-muted">For people swapping every week.</p>
            <p className="mt-6 font-display text-4xl font-extrabold">
              $9<span className="text-base font-semibold text-muted">/month</span>
            </p>
            <ul className="mt-6 space-y-3 text-sm">
              {PREMIUM_FEATURES.map(([label, included]) => (
                <Feature key={label} included={included}>{label}</Feature>
              ))}
            </ul>

            {plan === 'premium' ? (
              <p className="mt-8 text-center text-sm text-muted">
                You are on Premium — manage billing from your profile.
              </p>
            ) : (
              <button type="button" onClick={upgrade} disabled={pending} className="btn-primary mt-8 w-full">
                {pending ? <><Spinner /> Opening checkout…</> : 'Upgrade to Premium'}
              </button>
            )}
          </div>
        </section>
      </div>
    </>
  )
}

function Feature({ children, included }: { children: React.ReactNode; included: boolean }) {
  return (
    <li className="flex items-start gap-2.5">
      <svg
        className={included ? 'mt-0.5 shrink-0 text-brand-500' : 'mt-0.5 shrink-0 text-muted'}
        width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden
      >
        {included ? <path d="M20 6 9 17l-5-5" /> : <path d="M18 6 6 18M6 6l12 12" />}
      </svg>
      <span className={included ? '' : 'text-muted'}>{children}</span>
    </li>
  )
}
