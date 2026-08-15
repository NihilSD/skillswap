'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { FormError, SubmitButton } from '@/components/auth-form-parts'

export function SignUpForm() {
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)
  const [pending, setPending] = useState(false)
  const [checkEmail, setCheckEmail] = useState<string | null>(null)

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError(null)

    const form = new FormData(event.currentTarget)
    const name = String(form.get('name')).trim()
    const email = String(form.get('email')).trim()
    const password = String(form.get('password'))
    const confirm = String(form.get('confirm'))

    if (name.length < 2) return setError('Please enter your name.')
    if (password.length < 8) return setError('Password must be at least 8 characters.')
    if (password !== confirm) return setError('Those passwords do not match.')

    setPending(true)
    const supabase = createClient()
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        // Picked up by the handle_new_user() trigger to seed profiles.name.
        data: { name },
        emailRedirectTo: `${window.location.origin}/discover`,
      },
    })

    if (error) {
      setError(error.message)
      setPending(false)
      return
    }

    // With email confirmation switched on, Supabase returns a user but no
    // session — there is nothing to redirect to yet.
    if (!data.session) {
      setCheckEmail(email)
      setPending(false)
      return
    }

    router.replace('/profile')
    router.refresh()
  }

  if (checkEmail) {
    return (
      <div className="mt-8 space-y-4 text-center">
        <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-brand-50 text-3xl">
          📬
        </div>
        <h2 className="font-display text-lg font-bold">Check your email</h2>
        <p className="text-sm leading-relaxed text-muted">
          We sent a confirmation link to <strong className="text-ink">{checkEmail}</strong>.
          Click it to activate your account, then come back and sign in.
        </p>
        <button type="button" onClick={() => setCheckEmail(null)} className="btn-ghost">
          Use a different email
        </button>
      </div>
    )
  }

  return (
    <form onSubmit={onSubmit} className="mt-8 space-y-4" noValidate>
      <FormError message={error} />

      <div>
        <label className="label" htmlFor="name">Display name</label>
        <input id="name" name="name" type="text" autoComplete="name" required placeholder="Mara" className="input" onChange={() => setError(null)} />
      </div>

      <div>
        <label className="label" htmlFor="email">Email</label>
        <input id="email" name="email" type="email" autoComplete="email" required placeholder="you@example.com" className="input" onChange={() => setError(null)} />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="label" htmlFor="password">Password</label>
          <input id="password" name="password" type="password" autoComplete="new-password" required minLength={8} placeholder="8+ characters" className="input" onChange={() => setError(null)} />
        </div>
        <div>
          <label className="label" htmlFor="confirm">Confirm</label>
          <input id="confirm" name="confirm" type="password" autoComplete="new-password" required placeholder="Repeat it" className="input" onChange={() => setError(null)} />
        </div>
      </div>

      <SubmitButton pending={pending}>Create account</SubmitButton>

      <p className="text-center text-xs leading-relaxed text-muted">
        By signing up you agree to swap in good faith and show up when you say you will.
      </p>
    </form>
  )
}
