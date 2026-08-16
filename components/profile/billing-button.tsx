'use client'

import { useState } from 'react'
import { Spinner } from '@/components/auth-form-parts'

/** Opens the Stripe Customer Portal for a premium member. */
export function BillingButton() {
  const [pending, setPending] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function openPortal() {
    setPending(true)
    setError(null)

    try {
      const response = await fetch('/api/stripe/portal', { method: 'POST' })
      const body = await response.json()

      if (!response.ok) throw new Error(body.error ?? 'Could not open the billing portal')

      window.location.href = body.url
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not open the billing portal')
      setPending(false)
    }
  }

  return (
    <div>
      <button type="button" onClick={openPortal} disabled={pending} className="btn-secondary w-full">
        {pending ? <><Spinner /> Opening…</> : 'Manage billing'}
      </button>
      {error && <p className="alert-error mt-3" role="alert">{error}</p>}
    </div>
  )
}
