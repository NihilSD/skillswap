'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Spinner } from '@/components/auth-form-parts'
import { useCountdown } from '@/components/use-countdown'
import { PLAN_ERROR_CODES } from '@/lib/plan'
import type { Plan } from '@/lib/plan'
import type { Message } from '@/lib/database.types'

export type Conversation = {
  partnerId: string
  partnerName: string
  partnerEmoji: string
  lastMessage: string | null
  lastAt: string | null
  unread: boolean
}

export function MessagesClient({
  viewerId,
  plan,
  conversations,
  initialMessages,
  initialActiveId,
  sentToday,
  maxPerDay,
  resetAt,
}: {
  viewerId: string
  plan: Plan
  conversations: Conversation[]
  initialMessages: Message[]
  initialActiveId: string | null
  sentToday: number
  maxPerDay: number | null
  resetAt: string | null
}) {
  const [activeId, setActiveId] = useState(initialActiveId)
  const [messages, setMessages] = useState(initialMessages)
  const [draft, setDraft] = useState('')
  const [sending, setSending] = useState(false)
  const [sent, setSent] = useState(sentToday)
  const [error, setError] = useState<string | null>(null)
  const [limited, setLimited] = useState(maxPerDay != null && sentToday >= maxPerDay)
  const [limitResetAt, setLimitResetAt] = useState(resetAt)
  const bottomRef = useRef<HTMLDivElement>(null)
  const countdown = useCountdown(limited ? limitResetAt : null)

  const active = conversations.find((c) => c.partnerId === activeId) ?? null

  const thread = useMemo(
    () =>
      activeId
        ? messages.filter((m) => m.sender_id === activeId || m.receiver_id === activeId)
        : [],
    [messages, activeId]
  )

  // Realtime: Postgres INSERTs on messages addressed to the viewer arrive here
  // without any polling. Own sends are appended locally when they succeed.
  useEffect(() => {
    const supabase = createClient()
    const channel = supabase
      .channel(`messages:${viewerId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `receiver_id=eq.${viewerId}`,
        },
        (payload) => {
          const incoming = payload.new as Message
          setMessages((prev) =>
            prev.some((m) => m.id === incoming.id) ? prev : [...prev, incoming]
          )
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [viewerId])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ block: 'end' })
  }, [thread.length, activeId])

  async function send(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!activeId || !draft.trim()) return

    setSending(true)
    setError(null)

    const { data, error } = await createClient()
      .from('messages')
      .insert({ sender_id: viewerId, receiver_id: activeId, content: draft.trim() })
      .select()
      .single()

    setSending(false)

    if (error) {
      if (error.code === PLAN_ERROR_CODES.messageDaily) {
        setLimited(true)
        const { data: reset } = await createClient().rpc('message_reset_at', {
          p_user_id: viewerId,
        })
        setLimitResetAt((reset as string | null) ?? null)
      }
      // The draft is deliberately left in the box so nothing is lost.
      setError(
        error.code === PLAN_ERROR_CODES.messageDaily
          ? 'Daily message limit reached — upgrade for unlimited messaging.'
          : error.message
      )
      return
    }

    setMessages((prev) => [...prev, data as Message])
    setSent((n) => n + 1)
    setDraft('')

    if (maxPerDay != null && sent + 1 >= maxPerDay) setLimited(true)
  }

  return (
    <div className="grid gap-5 lg:grid-cols-[20rem_1fr] lg:items-start">
      {/* Conversation list — full width on mobile until a thread is picked. */}
      <aside className={`card overflow-hidden ${activeId ? 'hidden lg:block' : ''}`}>
        <ul className="divide-y divide-line">
          {conversations.map((c) => (
            <li key={c.partnerId}>
              <button
                type="button"
                onClick={() => setActiveId(c.partnerId)}
                aria-current={c.partnerId === activeId ? 'true' : undefined}
                className={`flex w-full items-center gap-3 px-4 py-3.5 text-left transition ${
                  c.partnerId === activeId ? 'bg-brand-50' : 'hover:bg-surface-2'
                }`}
              >
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-surface-2 text-lg">
                  {c.partnerEmoji}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="flex items-center gap-2">
                    <span className="truncate font-semibold">{c.partnerName}</span>
                    {c.unread && <span className="h-2 w-2 shrink-0 rounded-full bg-brand-500" />}
                  </span>
                  <span className="mt-0.5 block truncate text-xs text-muted">
                    {c.lastMessage ?? 'No messages yet — say hello.'}
                  </span>
                </span>
              </button>
            </li>
          ))}
        </ul>
      </aside>

      {/* Thread */}
      <section className={`card flex h-[32rem] flex-col lg:h-[36rem] ${activeId ? '' : 'hidden lg:flex'}`}>
        {active ? (
          <>
            <header className="flex items-center gap-3 border-b border-line px-4 py-3">
              <button
                type="button"
                onClick={() => setActiveId(null)}
                aria-label="Back to conversations"
                className="grid h-9 w-9 place-items-center rounded-full text-muted transition hover:bg-surface-2 hover:text-ink lg:hidden"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                  <path d="M15 18l-6-6 6-6" />
                </svg>
              </button>
              <span className="grid h-9 w-9 place-items-center rounded-full bg-surface-2 text-lg">
                {active.partnerEmoji}
              </span>
              <p className="font-semibold">{active.partnerName}</p>
              <span className="ml-auto chip">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                Live
              </span>
            </header>

            <div className="flex-1 space-y-2 overflow-y-auto px-4 py-4">
              {thread.length === 0 && (
                <p className="py-10 text-center text-sm text-muted">
                  No messages yet. Say hello to {active.partnerName}.
                </p>
              )}
              {thread.map((m) => {
                const mine = m.sender_id === viewerId
                return (
                  <div key={m.id} className={`flex ${mine ? 'justify-end' : 'justify-start'}`}>
                    <div
                      className={`max-w-[80%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed ${
                        mine
                          ? 'bg-gradient-to-br from-brand-600 to-brand-500 text-white'
                          : 'border border-line bg-surface-2'
                      }`}
                    >
                      <p className="whitespace-pre-wrap break-words">{m.content}</p>
                      <p className={`mt-1 text-[0.65rem] ${mine ? 'text-white/70' : 'text-muted'}`}>
                        {new Date(m.created_at).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </p>
                    </div>
                  </div>
                )
              })}
              <div ref={bottomRef} />
            </div>

            <footer className="border-t border-line p-3">
              {error && (
                <p className="alert-error mb-2" role="alert">
                  <span>
                    {limited && countdown ? `${error} Resets in ${countdown}.` : error}
                    {limited && (
                      <>
                        {' '}
                        <Link href="/pricing" className="font-semibold underline underline-offset-2">
                          See Premium
                        </Link>
                      </>
                    )}
                  </span>
                </p>
              )}

              <form onSubmit={send} className="flex gap-2">
                <input
                  className="input"
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  placeholder={limited ? 'Daily message limit reached' : `Message ${active.partnerName}…`}
                  aria-label="Message"
                  maxLength={2000}
                />
                <button
                  type="submit"
                  disabled={sending || limited || !draft.trim()}
                  className="btn-primary"
                >
                  {sending ? <Spinner /> : 'Send'}
                </button>
              </form>

              {maxPerDay != null && (
                <p className="mt-2 text-xs text-muted">
                  {Math.min(sent, maxPerDay)} of {maxPerDay} messages sent today
                  {plan === 'free' && (
                    <>
                      {' · '}
                      <Link href="/pricing" className="font-semibold text-brand-600 hover:underline">
                        go unlimited
                      </Link>
                    </>
                  )}
                </p>
              )}
            </footer>
          </>
        ) : (
          <div className="grid flex-1 place-items-center px-6 text-center">
            <p className="text-sm text-muted">Pick a conversation to start reading.</p>
          </div>
        )}
      </section>
    </div>
  )
}
