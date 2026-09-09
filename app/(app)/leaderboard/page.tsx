import type { Metadata } from 'next'
import Link from 'next/link'
import { PageHeader } from '@/components/page-header'
import { EmptyState } from '@/components/empty-state'
import { Stars } from '@/components/stars'
import { requireProfile } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'
import type { LeaderboardRow, UserRank } from '@/lib/database.types'

export const metadata: Metadata = { title: 'Leaderboard · SkillSwap' }

const MEDALS = ['🥇', '🥈', '🥉']

export default async function LeaderboardPage() {
  const { profile } = await requireProfile()
  const supabase = await createClient()

  // Both are single aggregate queries in Postgres — no N+1 from here.
  const [{ data: rows }, { data: ownRankRows }] = await Promise.all([
    supabase.rpc('get_leaderboard', { p_limit: 50 }),
    supabase.rpc('get_user_rank', { p_user_id: profile.id }),
  ])

  const leaders = (rows ?? []) as LeaderboardRow[]
  const own = ((ownRankRows ?? []) as UserRank[])[0] ?? null
  const inTable = leaders.some((r) => r.user_id === profile.id)

  return (
    <div className="container-page space-y-6">
      <PageHeader
        title="Leaderboard"
        subtitle="Ranked by completed swaps, then average rating."
      />

      {leaders.length === 0 ? (
        <EmptyState
          emoji="🏆"
          title="Nobody has completed a swap yet"
          body="Complete and rate a swap and you will be the first name on this board."
          action={<Link href="/discover" className="btn-primary">Find a swap</Link>}
        />
      ) : (
        <>
          {/* Table on desktop, stacked cards on mobile. */}
          <div className="card overflow-hidden">
            <div className="hidden grid-cols-[4rem_1fr_8rem_10rem] gap-4 border-b border-line px-5 py-3 text-xs font-semibold uppercase tracking-wider text-muted sm:grid">
              <span>Rank</span>
              <span>Member</span>
              <span className="text-right">Swaps</span>
              <span className="text-right">Rating</span>
            </div>

            <ul className="divide-y divide-line">
              {leaders.map((row) => {
                const isViewer = row.user_id === profile.id
                return (
                  <li
                    key={row.user_id}
                    className={`grid grid-cols-[3rem_1fr] gap-x-4 gap-y-2 px-5 py-4 sm:grid-cols-[4rem_1fr_8rem_10rem] sm:items-center ${
                      isViewer ? 'bg-brand-50' : ''
                    }`}
                  >
                    <span className="font-display text-lg font-extrabold text-muted">
                      {row.rank <= 3 ? MEDALS[row.rank - 1] : row.rank}
                    </span>

                    <div className="flex min-w-0 items-center gap-3">
                      <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-surface-2 text-lg">
                        {row.avatar_emoji}
                      </span>
                      <div className="min-w-0">
                        <p className="truncate font-semibold">
                          {row.name}
                          {isViewer && (
                            <span className="ml-2 chip border-brand-500/30 text-brand-600">You</span>
                          )}
                        </p>
                        {row.skills.length > 0 && (
                          <p className="mt-1 flex flex-wrap gap-1.5">
                            {row.skills.map((skill) => (
                              <span key={skill} className="chip text-[0.7rem]">{skill}</span>
                            ))}
                          </p>
                        )}
                      </div>
                    </div>

                    <span className="col-start-2 text-sm text-muted sm:col-start-auto sm:text-right sm:text-ink">
                      <span className="font-semibold">{row.completed_swaps}</span>
                      <span className="sm:hidden"> swaps completed</span>
                    </span>

                    <span className="col-start-2 sm:col-start-auto sm:flex sm:justify-end">
                      <Stars score={row.avg_rating} count={row.ratings_count} />
                    </span>
                  </li>
                )
              })}
            </ul>
          </div>

          {!inTable && own && (
            <div className="card flex flex-wrap items-center gap-4 border-brand-500/30 p-5">
              <span className="font-display text-lg font-extrabold text-muted">#{own.rank}</span>
              <span className="grid h-10 w-10 place-items-center rounded-full bg-surface-2 text-lg">
                {profile.avatar_emoji}
              </span>
              <div className="min-w-0 flex-1">
                <p className="font-semibold">{profile.name} <span className="chip ml-2 border-brand-500/30 text-brand-600">You</span></p>
                <p className="mt-0.5 text-sm text-muted">
                  {own.completed_swaps} completed {own.completed_swaps === 1 ? 'swap' : 'swaps'}
                </p>
              </div>
              <Stars score={own.avg_rating} count={own.ratings_count} />
            </div>
          )}
        </>
      )}
    </div>
  )
}
