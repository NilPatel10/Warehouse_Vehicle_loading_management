/**
 * Shared utility: converts total bottles to crates + loose bottles
 * using the product's configured bottles_per_crate.
 */
export function calcCratesAndLoose(totalBottles, bottlesPerCrate) {
  const bottles = Math.max(0, Math.floor(Number(totalBottles) || 0))
  const bpc = Math.max(1, Math.floor(Number(bottlesPerCrate) || 24))
  return {
    totalBottles: bottles,
    crates: Math.floor(bottles / bpc),
    loose: bottles % bpc
  }
}

/**
 * Formats a stock amount as "N Crates  M Bottles" string.
 */
export function formatStock(totalBottles, bottlesPerCrate) {
  const { crates, loose } = calcCratesAndLoose(totalBottles, bottlesPerCrate)
  if (crates === 0) return `${loose} Btl`
  if (loose === 0) return `${crates} Crates`
  return `${crates} Crates ${loose} Btl`
}

/**
 * StockDisplay – renders a card-like block showing bottles, crates, and loose bottles.
 * Used consistently across dashboard, history, and reports.
 */
export function StockDisplay({ totalBottles, bottlesPerCrate, label, compact = false }) {
  const { crates, loose } = calcCratesAndLoose(totalBottles, bottlesPerCrate)

  if (compact) {
    return (
      <span className="tabular-nums text-sm font-semibold">
        {totalBottles} Btl
        <span className="text-xs font-normal text-muted-foreground ml-1">
          ({crates}C {loose}L)
        </span>
      </span>
    )
  }

  return (
    <div className="rounded-md bg-muted/40 border px-3 py-2 text-sm">
      {label && <p className="text-xs text-muted-foreground mb-1 font-medium">{label}</p>}
      <div className="flex items-baseline gap-3 flex-wrap">
        <span className="text-lg font-bold tabular-nums">
          {Number(totalBottles).toLocaleString()} <span className="text-xs font-normal text-muted-foreground">Bottles</span>
        </span>
        <span className="text-sm text-muted-foreground">
          {crates} Crate{crates !== 1 ? 's' : ''}
          {' + '}
          {loose} Loose
        </span>
      </div>
    </div>
  )
}
