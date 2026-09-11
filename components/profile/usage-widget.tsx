'use client'

import Link from 'next/link'
import { useCountdown } from '@/components/use-countdown'
import type { PlanUsage } from '@/lib/database.types'

/**
 * Everything here comes from get_plan_usage(), which is built on the same
 * functions the enforcement triggers call — so these numbers cannot drift
 * from what the database will actually allow.
 */
export function UsageWidget({ usage }: { usage: PlanUsage }) {
  const requestsReset = useCountdown(
    usage.requests_today >= usage.requests_max ? usage.requests_reset_at : null
  )
  const messagesReset = useCountdown(
    usage.messages_max != null && usage.messages_today >= usage.messages_max
      ? usage.messages_reset_at
      : null
  )

  const free = usage.plan === 'free'

  return (
    <section className="card p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="font-display text-lg font-bold">
          {free ? 'Free plan usage' : 'Premium usage'}
        </h2>
        {free && (
          <Link href="/pricing" className="btn-secondary">Upgrade</Link>
        )}
      </div>

      <dl className="mt-5 grid gap-4 sm:grid-cols-3">
        <Meter
          label="Skills listed"
          used={usage.listings_used}
          max={usage.listings_max}
          note={`${usage.active_listings_used} of ${usage.active_listings_max} active`}
        />
        <Meter
          label="Requests today"
          used={usage.requests_today}
          max={usage.requests_max}
          note={requestsReset ? `Resets in ${requestsReset}` : 'Rolling 24 hours'}
        />
        <Meter
          label="Messages today"
          used={usage.messages_today}
          max={usage.messages_max}
          note={
            usage.messages_max == null
              ? 'Unlimited on Premium'
              : messagesReset
                ? `Resets in ${messagesReset}`
                : 'Rolling 24 hours'
          }
        />
      </dl>
    </section>
  )
}

function Meter({
  label,
  used,
  max,
  note,
}: {
  label: string
  used: number
  max: number | null
  note: string
}) {
  const unlimited = max == null
  const atLimit = !unlimited && used >= max
  const pct = unlimited ? 0 : Math.min(100, Math.round((used / Math.max(max, 1)) * 100))

  return (
    <div className="rounded-2xl border border-line bg-surface-2 p-4">
      <dt className="text-xs font-semibold uppercase tracking-wider text-muted">{label}</dt>
      <dd className="mt-1.5 font-display text-xl font-extrabold">
        {used}
        <span className="text-base font-semibold text-muted">
          {unlimited ? ' sent' : ` / ${max}`}
        </span>
      </dd>

      <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-line">
        <div
          className={`h-full rounded-full transition-all ${atLimit ? 'bg-amber-500' : 'bg-brand-500'}`}
          style={{ width: unlimited ? '100%' : `${pct}%` }}
        />
      </div>

      <p className="mt-2 text-xs text-muted">{note}</p>
    </div>
  )
}
