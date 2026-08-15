import type { Plan } from '@/lib/plan'

export function PlanBadge({ plan, className = '' }: { plan: Plan; className?: string }) {
  const premium = plan === 'premium'
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[0.65rem] font-bold uppercase tracking-wider ${
        premium
          ? 'bg-gradient-to-r from-brand-600 to-brand-400 text-white'
          : 'border border-line bg-surface-2 text-muted'
      } ${className}`}
    >
      {premium && <span aria-hidden>★</span>}
      {premium ? 'Premium' : 'Free'}
    </span>
  )
}
