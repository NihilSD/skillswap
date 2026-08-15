'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Spinner } from '@/components/auth-form-parts'
import { CATEGORIES, CATEGORY_EMOJI } from '@/lib/categories'
import type { WantedSkill } from '@/lib/database.types'

export function LearnSection({
  userId,
  initialSkills,
}: {
  userId: string
  initialSkills: WantedSkill[]
}) {
  const router = useRouter()
  const [skills, setSkills] = useState(initialSkills)
  const [pending, setPending] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // No plan limit applies to wanted skills.
  async function add(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError(null)

    const form = event.currentTarget
    const data = new FormData(form)
    const title = String(data.get('title')).trim()
    const category = String(data.get('category'))

    if (title.length < 2) {
      setError('Give the skill a name.')
      return
    }

    setPending(true)
    const { data: inserted, error } = await createClient()
      .from('wanted_skills')
      .insert({ user_id: userId, title, category })
      .select()
      .single()
    setPending(false)

    if (error) {
      setError(error.message)
      return
    }

    setSkills((prev) => [...prev, inserted as WantedSkill])
    form.reset()
    router.refresh()
  }

  async function remove(skill: WantedSkill) {
    const { error } = await createClient().from('wanted_skills').delete().eq('id', skill.id)
    if (error) {
      setError(error.message)
      return
    }
    setSkills((prev) => prev.filter((s) => s.id !== skill.id))
    router.refresh()
  }

  return (
    <section className="card p-6">
      <h2 className="font-display text-lg font-bold">Skills I want to learn</h2>
      <p className="mt-1 text-sm text-muted">
        No limit here — these power your best-match results in Discover.
      </p>

      <form onSubmit={add} className="mt-5 grid gap-3 sm:grid-cols-[1fr_11rem_auto]">
        <input name="title" className="input" placeholder="Italian cooking" maxLength={80} required aria-label="Skill you want to learn" />
        <select name="category" className="input" defaultValue="Cooking" aria-label="Category">
          {CATEGORIES.map((c) => (
            <option key={c} value={c}>{CATEGORY_EMOJI[c]} {c}</option>
          ))}
        </select>
        <button type="submit" disabled={pending} className="btn-secondary">
          {pending ? <Spinner /> : 'Add'}
        </button>
      </form>

      {error && <p className="alert-error mt-4" role="alert">{error}</p>}

      {skills.length === 0 ? (
        <p className="mt-5 rounded-2xl border border-dashed border-line px-5 py-8 text-center text-sm text-muted">
          Nothing on your list yet. Add something you have been meaning to pick up.
        </p>
      ) : (
        <ul className="mt-5 flex flex-wrap gap-2">
          {skills.map((skill) => (
            <li key={skill.id}>
              <span className="chip py-1.5 pr-1.5 text-sm text-ink">
                <span aria-hidden>{CATEGORY_EMOJI[skill.category] ?? '✨'}</span>
                {skill.title}
                <button
                  type="button"
                  onClick={() => remove(skill)}
                  aria-label={`Remove ${skill.title}`}
                  className="grid h-5 w-5 place-items-center rounded-full text-muted transition hover:bg-red-500/10 hover:text-red-600"
                >
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" aria-hidden>
                    <path d="M18 6 6 18M6 6l12 12" />
                  </svg>
                </button>
              </span>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
