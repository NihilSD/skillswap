'use client'

import { useEffect, useState } from 'react'
import { formatCountdown } from '@/lib/countdown'

function labelFor(resetAt: string | null): string | null {
  if (!resetAt) return null
  return formatCountdown(new Date(resetAt).getTime() - Date.now())
}

/**
 * Live countdown to `resetAt`, re-rendering every 30s. Returns null when there
 * is nothing to count down to.
 *
 * The first value is computed during render and adjusted during render when
 * `resetAt` changes — React's documented alternative to setting state inside
 * an effect, which triggers a second render pass.
 */
export function useCountdown(resetAt: string | null): string | null {
  const [label, setLabel] = useState(() => labelFor(resetAt))
  const [trackedResetAt, setTrackedResetAt] = useState(resetAt)

  if (trackedResetAt !== resetAt) {
    setTrackedResetAt(resetAt)
    setLabel(labelFor(resetAt))
  }

  useEffect(() => {
    if (!resetAt) return

    const target = new Date(resetAt).getTime()
    const id = setInterval(() => setLabel(formatCountdown(target - Date.now())), 30_000)
    return () => clearInterval(id)
  }, [resetAt])

  return label
}
