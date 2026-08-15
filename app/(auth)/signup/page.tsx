import type { Metadata } from 'next'
import Link from 'next/link'
import { SignUpForm } from './sign-up-form'

export const metadata: Metadata = { title: 'Create your account · SkillSwap' }

export default function SignUpPage() {
  return (
    <div>
      <h1 className="font-display text-2xl font-extrabold tracking-tight">Create your account</h1>
      <p className="mt-1.5 text-sm text-muted">Free forever for your first skill.</p>

      <SignUpForm />

      <p className="mt-6 text-center text-sm text-muted">
        Already have an account?{' '}
        <Link href="/signin" className="font-semibold text-brand-600 hover:underline">
          Sign in
        </Link>
      </p>
    </div>
  )
}
