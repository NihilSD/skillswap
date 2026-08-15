import Link from 'next/link'

export function Logo({ href = '/' }: { href?: string }) {
  return (
    <Link href={href} className="group inline-flex items-center gap-2.5">
      <span className="relative grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br from-brand-600 to-brand-400 text-white shadow-glow transition group-hover:scale-105">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M4 8h12l-3-3M20 16H8l3 3" />
        </svg>
      </span>
      <span className="font-display text-lg font-extrabold tracking-tight">SkillSwap</span>
    </Link>
  )
}
