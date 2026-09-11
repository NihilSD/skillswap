'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

export function NavLinks({
  items,
  className = '',
  onNavigate,
}: {
  items: { href: string; label: string }[]
  className?: string
  onNavigate?: () => void
}) {
  const pathname = usePathname()

  return (
    <nav className={`items-center gap-1 ${className}`}>
      {items.map((item) => {
        const active = pathname === item.href || pathname.startsWith(`${item.href}/`)
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavigate}
            aria-current={active ? 'page' : undefined}
            className={`rounded-full px-3.5 py-2 text-sm font-semibold transition ${
              active ? 'bg-brand-50 text-brand-600' : 'text-muted hover:bg-surface-2 hover:text-ink'
            }`}
          >
            {item.label}
          </Link>
        )
      })}
    </nav>
  )
}
