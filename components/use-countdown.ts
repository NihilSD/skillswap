'use client'

import { useEffect, useState } from 'react'
import { formatCountdown } from '@/lib/countdown'

/**
 * Live countdown to `resetAt`, re-rendering every 30s. Returns null when there
 * is nothing to count down to.
 */
export function useCountdown(resetAt: string | null): string | null {
  const [label, setLabel] = useState<string | null>(null)

  useEffect(() => {
    if (!resetAt) {
      setLabel(null)
      return
    }

    const target = new Date(resetAt).getTime()
    const tick = () => setLabel(formatCountdown(target - Date.now()))

    tick()
    const id = setInterval(tick, 30_000)
    return () => clearInterval(id)
  }, [resetAt])

  return label
}
