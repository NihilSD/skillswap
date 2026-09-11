/** "3h 24m" / "48m" / "under a minute" — for daily-limit reset countdowns. */
export function formatCountdown(msRemaining: number): string {
  if (msRemaining <= 0) return 'any moment now'

  const totalMinutes = Math.ceil(msRemaining / 60000)
  const hours = Math.floor(totalMinutes / 60)
  const minutes = totalMinutes % 60

  if (hours === 0 && minutes <= 1) return 'under a minute'
  if (hours === 0) return `${minutes}m`
  return `${hours}h ${minutes}m`
}
