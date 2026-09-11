'use client'

import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { FormError, SubmitButton } from '@/components/auth-form-parts'

/**
 * Only same-origin paths are honoured. `//evil.com` and `/\evil.com` both
 * start with '/' but are protocol-relative URLs the browser resolves to
 * another origin — a classic open-redirect used to make phishing links look
 * like they come from us.
 */
function safeNext(next: string | null): string {
  if (!next) return '/discover'
  if (!next.startsWith('/')) return '/discover'
  if (next.startsWith('//') || next.startsWith('/\\')) return '/discover'
  return next
}

export function SignInForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const next = searchParams.get('next')
  const [error, setError] = useState<string | null>(null)
  const [pending, setPending] = useState(false)

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError(null)
    setPending(true)

    const form = new FormData(event.currentTarget)
    const supabase = createClient()
    const { error } = await supabase.auth.signInWithPassword({
      email: String(form.get('email')).trim(),
      password: String(form.get('password')),
    })

    if (error) {
      // Deliberately vague: never reveal whether the email exists.
      setError('That email and password combination did not work.')
      setPending(false)
      return
    }

    router.replace(safeNext(next))
    router.refresh()
  }

  return (
    <form onSubmit={onSubmit} className="mt-8 space-y-4" noValidate>
      <FormError message={error} />

      <div>
        <label className="label" htmlFor="email">Email</label>
        <input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          required
          placeholder="you@example.com"
          className="input"
          onChange={() => setError(null)}
        />
      </div>

      <div>
        <label className="label" htmlFor="password">Password</label>
        <input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
          placeholder="••••••••"
          className="input"
          onChange={() => setError(null)}
        />
      </div>

      <SubmitButton pending={pending}>Sign in</SubmitButton>
    </form>
  )
}
