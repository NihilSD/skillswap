import Link from 'next/link'
import { Logo } from '@/components/logo'
import { ThemeToggle } from '@/components/theme-toggle'

const highlights = [
  { emoji: '🎯', text: 'List a skill you can teach' },
  { emoji: '🔍', text: 'Find someone teaching what you want' },
  { emoji: '⚡', text: 'Message them in realtime and swap' },
]

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid min-h-dvh lg:grid-cols-2">
      {/* Brand panel — desktop only. */}
      <aside className="relative hidden overflow-hidden border-r border-line bg-surface-2 lg:block">
        <div className="absolute inset-0 grid-fade" aria-hidden />
        <div className="aurora left-[-6rem] top-[-4rem] h-[28rem] w-[28rem] bg-brand-500/40 animate-float" aria-hidden />
        <div className="aurora bottom-[-8rem] right-[-4rem] h-[24rem] w-[24rem] bg-accent/25 animate-float [animation-delay:2s]" aria-hidden />
        <div className="relative flex h-full flex-col justify-between p-10 xl:p-14">
          <Logo />
          <div>
            <h2 className="max-w-md font-display text-4xl font-extrabold leading-tight tracking-tight">
              Everyone knows something{' '}
              <span className="gradient-text">worth trading.</span>
            </h2>
            <ul className="mt-8 space-y-4">
              {highlights.map((h) => (
                <li key={h.text} className="flex items-center gap-3 text-sm">
                  <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-surface text-base shadow-soft">
                    {h.emoji}
                  </span>
                  <span className="text-muted">{h.text}</span>
                </li>
              ))}
            </ul>
          </div>
          <p className="text-xs text-muted">No money changes hands — just skills.</p>
        </div>
      </aside>

      {/* Form panel. */}
      <main className="relative flex flex-col">
        <div className="flex items-center justify-between p-5 sm:p-6">
          <div className="lg:invisible">
            <Logo />
          </div>
          <ThemeToggle />
        </div>
        <div className="flex flex-1 items-center justify-center px-5 pb-16 sm:px-6">
          <div className="w-full max-w-sm animate-fade-up">{children}</div>
        </div>
        <div className="p-5 text-center text-xs text-muted sm:p-6">
          <Link href="/" className="hover:text-ink">← Back home</Link>
        </div>
      </main>
    </div>
  )
}
