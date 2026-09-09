'use client'

import { useEffect, useState } from 'react'
import { usePathname } from 'next/navigation'
import { NavLinks } from '@/components/nav/nav-links'
import { PlanBadge } from '@/components/nav/plan-badge'
import { SignOutButton } from '@/components/nav/sign-out-button'
import { ThemeToggle } from '@/components/theme-toggle'
import type { Plan } from '@/lib/plan'

export function MobileNav({
  items,
  name,
  avatarEmoji,
  plan,
}: {
  items: { href: string; label: string }[]
  name: string
  avatarEmoji: string
  plan: Plan
}) {
  const [open, setOpen] = useState(false)
  const pathname = usePathname()
  const [trackedPathname, setTrackedPathname] = useState(pathname)

  // Navigating closes the menu. Adjusting during render avoids the extra
  // render pass an effect would cause.
  if (trackedPathname !== pathname) {
    setTrackedPathname(pathname)
    setOpen(false)
  }

  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : ''
    return () => {
      document.body.style.overflow = ''
    }
  }, [open])

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-label={open ? 'Close menu' : 'Open menu'}
        className="grid h-9 w-9 place-items-center rounded-full border border-line bg-surface text-ink xl:hidden"
      >
        <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
          {open ? <path d="M18 6 6 18M6 6l12 12" /> : <path d="M4 7h16M4 12h16M4 17h16" />}
        </svg>
      </button>

      {open && (
        <div className="fixed inset-x-0 bottom-0 top-16 z-40 overflow-y-auto bg-bg/95 backdrop-blur-xl xl:hidden">
          <div className="container-page py-6">
            <div className="card flex items-center gap-3 p-4">
              <span className="grid h-11 w-11 place-items-center rounded-full bg-surface-2 text-xl">
                {avatarEmoji}
              </span>
              <div className="min-w-0">
                <p className="truncate font-semibold">{name}</p>
                <PlanBadge plan={plan} className="mt-1" />
              </div>
              <ThemeToggle className="ml-auto" />
            </div>

            <NavLinks
              items={items}
              className="mt-4 flex flex-col !items-stretch gap-1 [&>a]:px-4 [&>a]:py-3 [&>a]:text-base"
              onNavigate={() => setOpen(false)}
            />

            <SignOutButton className="btn-secondary mt-4 w-full" />
          </div>
        </div>
      )}
    </>
  )
}
