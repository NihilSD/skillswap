export function Stars({ score, count }: { score: number | null; count: number }) {
  if (score == null) {
    return <span className="text-sm text-muted">Not rated yet</span>
  }

  const rounded = Math.round(score)

  return (
    <span className="inline-flex items-center gap-1.5" title={`${score} out of 5`}>
      <span aria-hidden className="text-sm tracking-tight">
        {'★'.repeat(rounded)}
        <span className="text-line">{'★'.repeat(5 - rounded)}</span>
      </span>
      <span className="text-sm font-semibold">{Number(score).toFixed(1)}</span>
      <span className="text-xs text-muted">({count})</span>
    </span>
  )
}
