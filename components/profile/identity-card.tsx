'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { FormError, Spinner } from '@/components/auth-form-parts'
import type { Profile } from '@/lib/database.types'

const EMOJI_CHOICES = [
  '🙂','😎','🤓','🧑‍🎓','🧑‍🍳','🧑‍💻','🧑‍🎨','🧑‍🔧','🧑‍🚀','🎸','🎹','🎤',
  '📚','🧶','🪴','🍜','🏋️','🚴','🎯','🐙','🦊','🐝','🌵','⭐',
]

export function IdentityCard({ profile }: { profile: Profile }) {
  const router = useRouter()
  const [emoji, setEmoji] = useState(profile.avatar_emoji)
  const [name, setName] = useState(profile.name)
  const [bio, setBio] = useState(profile.bio ?? '')
  const [pickerOpen, setPickerOpen] = useState(false)
  const [pending, setPending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [saved, setSaved] = useState(false)

  const dirty =
    emoji !== profile.avatar_emoji ||
    name !== profile.name ||
    bio !== (profile.bio ?? '')

  async function save(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError(null)
    setSaved(false)

    if (name.trim().length < 2) {
      setError('Please enter a display name.')
      return
    }

    setPending(true)
    const { error } = await createClient()
      .from('profiles')
      .update({ name: name.trim(), avatar_emoji: emoji, bio: bio.trim() || null })
      .eq('id', profile.id)
    setPending(false)

    if (error) {
      setError(error.message)
      return
    }

    setSaved(true)
    router.refresh()
    setTimeout(() => setSaved(false), 2500)
  }

  return (
    <form onSubmit={save} className="card p-6 lg:sticky lg:top-24">
      <div className="flex items-center gap-4">
        <button
          type="button"
          onClick={() => setPickerOpen((v) => !v)}
          aria-expanded={pickerOpen}
          className="grid h-16 w-16 shrink-0 place-items-center rounded-2xl border border-line bg-surface-2 text-3xl transition hover:border-brand-500 hover:shadow-soft"
        >
          {emoji}
        </button>
        <div>
          <p className="font-display font-bold">Your avatar</p>
          <button
            type="button"
            onClick={() => setPickerOpen((v) => !v)}
            className="text-sm font-semibold text-brand-600 hover:underline"
          >
            {pickerOpen ? 'Close picker' : 'Pick an emoji'}
          </button>
        </div>
      </div>

      {pickerOpen && (
        <div className="mt-4 grid grid-cols-8 gap-1.5 rounded-xl border border-line bg-surface-2 p-2.5">
          {EMOJI_CHOICES.map((choice) => (
            <button
              key={choice}
              type="button"
              onClick={() => {
                setEmoji(choice)
                setPickerOpen(false)
              }}
              aria-label={`Use ${choice} as your avatar`}
              aria-pressed={emoji === choice}
              className={`grid aspect-square place-items-center rounded-lg text-lg transition hover:bg-surface ${
                emoji === choice ? 'bg-surface ring-2 ring-brand-500' : ''
              }`}
            >
              {choice}
            </button>
          ))}
        </div>
      )}

      <div className="mt-6 space-y-4">
        <div>
          <label className="label" htmlFor="display-name">Display name</label>
          <input
            id="display-name"
            className="input"
            value={name}
            maxLength={60}
            onChange={(e) => setName(e.target.value)}
          />
        </div>

        <div>
          <label className="label" htmlFor="bio">Bio</label>
          <textarea
            id="bio"
            className="textarea"
            value={bio}
            maxLength={280}
            placeholder="What are you into? What are you hoping to learn?"
            onChange={(e) => setBio(e.target.value)}
          />
          <p className="mt-1 text-right text-xs text-muted">{bio.length}/280</p>
        </div>

        <FormError message={error} />

        {saved && (
          <p className="alert-success" role="status">
            <span aria-hidden>✓</span> Profile saved.
          </p>
        )}

        <button type="submit" disabled={pending || !dirty} className="btn-primary w-full">
          {pending ? <><Spinner /> Saving…</> : 'Save changes'}
        </button>
      </div>
    </form>
  )
}
