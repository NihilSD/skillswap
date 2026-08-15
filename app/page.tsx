import Link from 'next/link'
import { Logo } from '@/components/logo'
import { ThemeToggle } from '@/components/theme-toggle'

const steps = [
  {
    emoji: '🎯',
    title: 'List what you teach',
    body: 'Add the skills you are genuinely good at — guitar, Python, sourdough, conversational Spanish.',
  },
  {
    emoji: '🔍',
    title: 'Discover a match',
    body: 'Browse the marketplace of people offering exactly the thing sitting on your want-to-learn list.',
  },
  {
    emoji: '🤝',
    title: 'Swap and rate',
    body: 'Send a swap request, chat in realtime, meet up, then rate each other and climb the leaderboard.',
  },
]

const showcase = [
  { emoji: '🎸', name: 'Mara', teaches: 'Fingerstyle guitar', wants: 'Italian cooking' },
  { emoji: '🧑‍💻', name: 'Devon', teaches: 'TypeScript & React', wants: 'Film photography' },
  { emoji: '🍜', name: 'Aiko', teaches: 'Ramen from scratch', wants: 'Public speaking' },
  { emoji: '🪴', name: 'Sam', teaches: 'Urban gardening', wants: 'Music production' },
]

export default function Home() {
  return (
    <div className="relative overflow-hidden">
      {/* ---------------------------------------------------------------- nav */}
      <header className="sticky top-0 z-40 border-b border-line/70 bg-bg/70 backdrop-blur-xl">
        <div className="container-page flex h-16 items-center justify-between">
          <Logo />
          <nav className="hidden items-center gap-1 md:flex">
            <a href="#how" className="btn-ghost">How it works</a>
            <a href="#people" className="btn-ghost">Community</a>
            <a href="#pricing" className="btn-ghost">Pricing</a>
          </nav>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <Link href="/signin" className="btn-secondary hidden sm:inline-flex">Sign in</Link>
            <Link href="/signup" className="btn-primary">Get started</Link>
          </div>
        </div>
      </header>

      {/* -------------------------------------------------------------- hero */}
      <section className="relative">
        <div className="absolute inset-0 grid-fade" aria-hidden />
        <div className="aurora left-[-10%] top-[-8rem] h-[26rem] w-[26rem] bg-brand-500/40 animate-float" aria-hidden />
        <div className="aurora right-[-6%] top-[2rem] h-[22rem] w-[22rem] bg-accent/30 animate-float [animation-delay:2s]" aria-hidden />

        <div className="container-page relative py-20 sm:py-28 lg:py-32">
          <div className="mx-auto max-w-4xl text-center">
            <span className="chip animate-fade-up">
              <span className="h-1.5 w-1.5 rounded-full bg-accent" />
              No money changes hands — just skills
            </span>
            <h1 className="mt-6 font-display text-4xl font-extrabold leading-[1.05] tracking-tight text-balance animate-fade-up [animation-delay:80ms] sm:text-6xl">
              Trade what you know for{' '}
              <span className="gradient-text">what you want to learn</span>
            </h1>
            <p className="mx-auto mt-6 max-w-xl text-base leading-relaxed text-muted animate-fade-up [animation-delay:160ms] sm:text-lg">
              SkillSwap pairs people who can teach with people who want to learn. List a
              skill, find your match, message them in realtime, and swap.
            </p>
            <div className="mt-9 flex flex-col items-center justify-center gap-3 animate-fade-up [animation-delay:240ms] sm:flex-row">
              <Link href="/signup" className="btn-primary w-full sm:w-auto">
                Create your free account
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M5 12h14M13 6l6 6-6 6" />
                </svg>
              </Link>
              <a href="#how" className="btn-secondary w-full sm:w-auto">See how it works</a>
            </div>
            <p className="mt-4 text-xs text-muted animate-fade-up [animation-delay:300ms]">
              Free forever for one skill. Premium unlocks filters and higher limits.
            </p>
          </div>

          {/* --------------------------------------------------- swap preview */}
          <div className="mx-auto mt-16 max-w-4xl animate-fade-up [animation-delay:360ms]">
            <div className="card overflow-hidden p-1.5 shadow-lift">
              <div className="rounded-[0.9rem] bg-surface-2 p-5 sm:p-8">
                <div className="grid items-center gap-4 sm:grid-cols-[1fr_auto_1fr]">
                  <SwapCard emoji="🎸" name="Mara" role="Teaches" skill="Fingerstyle guitar" />
                  <div className="mx-auto grid h-11 w-11 place-items-center rounded-full bg-gradient-to-br from-brand-600 to-brand-400 text-white shadow-glow sm:rotate-0">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M4 8h12l-3-3M20 16H8l3 3" />
                    </svg>
                  </div>
                  <SwapCard emoji="🍝" name="Luca" role="Teaches" skill="Italian cooking" />
                </div>
                <div className="mt-6 flex flex-wrap items-center justify-center gap-2 text-xs text-muted">
                  <span className="chip">⚡ Realtime chat</span>
                  <span className="chip">⭐ Two-way ratings</span>
                  <span className="chip">🏆 Community leaderboard</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------ how it works */}
      <section id="how" className="container-page scroll-mt-20 py-20 sm:py-24">
        <div className="max-w-2xl">
          <h2 className="font-display text-3xl font-extrabold tracking-tight sm:text-4xl">
            Three steps to your first swap
          </h2>
          <p className="mt-4 text-muted">
            No credits, no invoices, no awkward pricing conversations. Everyone brings
            something to the table.
          </p>
        </div>
        <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {steps.map((s, i) => (
            <div key={s.title} className="card group relative p-6 transition duration-300 hover:-translate-y-1 hover:shadow-lift">
              <span className="absolute right-5 top-5 font-display text-5xl font-extrabold text-line/70 transition group-hover:text-brand-500/25">
                {i + 1}
              </span>
              <div className="grid h-12 w-12 place-items-center rounded-2xl bg-brand-50 text-2xl">{s.emoji}</div>
              <h3 className="mt-5 font-display text-lg font-bold">{s.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted">{s.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ---------------------------------------------------------- showcase */}
      <section id="people" className="scroll-mt-20 border-y border-line bg-surface-2/60 py-20 sm:py-24">
        <div className="container-page">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div className="max-w-xl">
              <h2 className="font-display text-3xl font-extrabold tracking-tight sm:text-4xl">
                People already swapping
              </h2>
              <p className="mt-4 text-muted">
                A preview of the marketplace. Sign in to see the real directory.
              </p>
            </div>
            <Link href="/signup" className="btn-secondary">Join them</Link>
          </div>
          <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {showcase.map((p) => (
              <article key={p.name} className="card p-5 transition duration-300 hover:-translate-y-1 hover:shadow-lift">
                <div className="flex items-center gap-3">
                  <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-surface-2 text-xl">{p.emoji}</span>
                  <div className="min-w-0">
                    <p className="truncate font-semibold">{p.name}</p>
                    <p className="text-xs text-muted">Member</p>
                  </div>
                </div>
                <dl className="mt-5 space-y-3 text-sm">
                  <div>
                    <dt className="text-[0.7rem] font-semibold uppercase tracking-wider text-muted">Teaches</dt>
                    <dd className="mt-0.5 font-medium">{p.teaches}</dd>
                  </div>
                  <div>
                    <dt className="text-[0.7rem] font-semibold uppercase tracking-wider text-muted">Wants</dt>
                    <dd className="mt-0.5 font-medium text-muted">{p.wants}</dd>
                  </div>
                </dl>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* ----------------------------------------------------------- pricing */}
      <section id="pricing" className="container-page scroll-mt-20 py-20 sm:py-24">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="font-display text-3xl font-extrabold tracking-tight sm:text-4xl">
            Start free. Upgrade when you outgrow it.
          </h2>
          <p className="mt-4 text-muted">
            Every limit below is enforced in the database, so the free tier is honest —
            not a UI suggestion.
          </p>
        </div>
        <div className="mx-auto mt-12 grid max-w-4xl gap-5 md:grid-cols-2">
          <div className="card p-7">
            <h3 className="font-display text-xl font-bold">Free</h3>
            <p className="mt-1 text-sm text-muted">Everything you need for your first swap.</p>
            <p className="mt-6 font-display text-4xl font-extrabold">$0</p>
            <ul className="mt-6 space-y-3 text-sm">
              <Feature>1 skill listed, 1 active</Feature>
              <Feature>Browse the full marketplace</Feature>
              <Feature muted>No search filters</Feature>
              <Feature>1 swap request per day</Feature>
              <Feature>10 messages per day</Feature>
            </ul>
            <Link href="/signup" className="btn-secondary mt-8 w-full">Get started</Link>
          </div>
          <div className="card relative overflow-hidden p-7 ring-1 ring-brand-500/40">
            <div className="aurora right-[-4rem] top-[-6rem] h-56 w-56 bg-brand-500/40" aria-hidden />
            <div className="relative">
              <div className="flex items-center justify-between">
                <h3 className="font-display text-xl font-bold">Premium</h3>
                <span className="chip border-brand-500/30 bg-brand-50 text-brand-600">Most popular</span>
              </div>
              <p className="mt-1 text-sm text-muted">For people swapping every week.</p>
              <p className="mt-6 font-display text-4xl font-extrabold">
                $9<span className="text-base font-semibold text-muted">/month</span>
              </p>
              <ul className="mt-6 space-y-3 text-sm">
                <Feature>Up to 3 skills, all active</Feature>
                <Feature>Keyword, category & best-match filters</Feature>
                <Feature>3 swap requests per day</Feature>
                <Feature>Unlimited messages</Feature>
                <Feature>Priority on the leaderboard tags</Feature>
              </ul>
              <Link href="/signup" className="btn-primary mt-8 w-full">Go Premium</Link>
            </div>
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------------ footer */}
      <footer className="border-t border-line py-10">
        <div className="container-page flex flex-col items-center justify-between gap-4 text-sm text-muted sm:flex-row">
          <Logo />
          <p>Built with Next.js and Supabase.</p>
        </div>
      </footer>
    </div>
  )
}

function SwapCard({ emoji, name, role, skill }: { emoji: string; name: string; role: string; skill: string }) {
  return (
    <div className="card flex items-center gap-4 p-4">
      <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-surface-2 text-2xl">{emoji}</span>
      <div className="min-w-0">
        <p className="text-[0.7rem] font-semibold uppercase tracking-wider text-muted">{role}</p>
        <p className="truncate font-display font-bold">{skill}</p>
        <p className="truncate text-xs text-muted">{name}</p>
      </div>
    </div>
  )
}

function Feature({ children, muted = false }: { children: React.ReactNode; muted?: boolean }) {
  return (
    <li className="flex items-start gap-2.5">
      <svg
        className={muted ? 'mt-0.5 shrink-0 text-muted' : 'mt-0.5 shrink-0 text-brand-500'}
        width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round"
      >
        {muted ? <path d="M18 6 6 18M6 6l12 12" /> : <path d="M20 6 9 17l-5-5" />}
      </svg>
      <span className={muted ? 'text-muted' : ''}>{children}</span>
    </li>
  )
}
