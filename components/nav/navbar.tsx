import Link from 'next/link'
import { Logo } from '@/components/logo'
import { ThemeToggle } from '@/components/theme-toggle'
import { PlanBadge } from '@/components/nav/plan-badge'
import { NavLinks } from '@/components/nav/nav-links'
import { MobileNav } from '@/components/nav/mobile-nav'
import { SignOutButton } from '@/components/nav/sign-out-button'
import type { Plan } from '@/lib/plan'

export const NAV_ITEMS = [
  { href: '/discover', label: 'Discover' },
  { href: '/matches', label: 'Matches' },
  { href: '/messages', label: 'Messages' },
  { href: '/leaderboard', label: 'Leaderboard' },
  { href: '/profile', label: 'Profile' },
  { href: '/pricing', label: 'Pricing' },
]

export function Navbar({
  name,
  avatarEmoji,
  plan,
}: {
  name: string
  avatarEmoji: string
  plan: Plan
}) {
  return (
    <header className="sticky top-0 z-40 border-b border-line/70 bg-bg/80 backdrop-blur-xl">
      <div className="container-page flex h-16 items-center gap-4">
        <Logo href="/discover" />

        <NavLinks items={NAV_ITEMS} className="ml-2 hidden lg:flex" />

        <div className="ml-auto flex items-center gap-2">
          <ThemeToggle className="hidden sm:grid" />

          <Link
            href="/profile"
            className="hidden items-center gap-2 rounded-full border border-line bg-surface py-1 pl-1 pr-3 transition hover:bg-surface-2 sm:flex"
          >
            <span className="grid h-7 w-7 place-items-center rounded-full bg-surface-2 text-base">
              {avatarEmoji}
            </span>
            <span className="max-w-[8rem] truncate text-sm font-semibold">{name}</span>
            <PlanBadge plan={plan} />
          </Link>

          <SignOutButton className="btn-ghost hidden lg:inline-flex" />

          <MobileNav items={NAV_ITEMS} name={name} avatarEmoji={avatarEmoji} plan={plan} />
        </div>
      </div>
    </header>
  )
}
