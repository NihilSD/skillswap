import { Suspense } from 'react'
import type { Metadata } from 'next'
import Link from 'next/link'
import { SignInForm } from './sign-in-form'

export const metadata: Metadata = { title: 'Sign in · SkillSwap' }

export default function SignInPage() {
  return (
    <div>
      <h1 className="font-display text-2xl font-extrabold tracking-tight">Welcome back</h1>
      <p className="mt-1.5 text-sm text-muted">Sign in to pick up where you left off.</p>

      <Suspense fallback={<div className="mt-8 h-64" />}>
        <SignInForm />
      </Suspense>

      <p className="mt-6 text-center text-sm text-muted">
        New here?{' '}
        <Link href="/signup" className="font-semibold text-brand-600 hover:underline">
          Create an account
        </Link>
      </p>
    </div>
  )
}
