import { calculateRouteSummary } from '@/lib/calculations'
import { Badge } from '@/components/ui/badge'

export function LoadingSummary({ route }) {
  const summary = calculateRouteSummary(route)

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
        <Metric label="Total bottles" value={summary.totals.orderedQuantity} />
        <Metric label="Crates" value={summary.totals.fullCrates} />
        <Metric label="Loose" value={summary.totals.looseBottles} />
        <Metric label="Free water" value={summary.totals.freeWaterBottles} />
        <Metric label="Free 250 ml" value={summary.totals.free250mlBottles} />
      </div>

      {/* Calculation explanation for warehouse staff */}
      <div className="rounded-md border border-blue-200 bg-blue-50 dark:border-blue-900 dark:bg-blue-950/40 p-3 text-xs text-blue-800 dark:text-blue-300 space-y-1">
        <p className="font-semibold text-blue-900 dark:text-blue-200">📦 How these values are calculated</p>
        <p><span className="font-medium">Crates</span> = Total Bottles ÷ Bottles Per Crate (rounded down). Example: 18 bottles ÷ 9 per crate = 2 full crates.</p>
        <p><span className="font-medium">Loose</span> = Remaining bottles after full crates. Example: 15 bottles ÷ 9 per crate = 1 crate + <strong>6 loose</strong>.</p>
        <p><span className="font-medium">Free Water</span> = Full Crates × Water Bottles Per Crate. <span className="font-medium">Priority rule:</span> if a Manual Override is entered on the order, it is used exclusively; otherwise the Category Default is used. Only full crates earn free water — loose bottles do not count.</p>
        <p><span className="font-medium">Free 250 ml</span> = Total Bottles × Free 250ml Per Bottle Rate (configured per bottle category). Example: 18 bottles × 1 = 18 free 250ml bottles.</p>
        <p className="pt-1 text-blue-700 dark:text-blue-400">The product table shows consolidated totals across all shops on this route.</p>
      </div>

      <div className="overflow-hidden rounded-lg border bg-card">
        <div className="grid grid-cols-[minmax(130px,1.5fr)_repeat(5,minmax(64px,0.7fr))] gap-0 overflow-x-auto text-sm">
          <div className="contents font-semibold text-muted-foreground">
            <div className="bg-muted p-3">Product</div>
            <div className="bg-muted p-3 text-right">Qty</div>
            <div className="bg-muted p-3 text-right">Crates</div>
            <div className="bg-muted p-3 text-right">Loose</div>
            <div className="bg-muted p-3 text-right">Water</div>
            <div className="bg-muted p-3 text-right">250 ml</div>
          </div>
          {summary.products.map((product) => (
            <div key={product.productId} className="contents border-t">
              <div className="p-3 font-bold">{product.productName}</div>
              <Cell value={product.orderedQuantity} strong />
              <Cell value={product.fullCrates} />
              <Cell value={product.looseBottles} />
              <Cell value={product.freeWaterBottles} />
              <Cell value={product.free250mlBottles} />
            </div>
          ))}
        </div>
        {!summary.products.length ? (
          <p className="p-4 text-sm text-muted-foreground">No products added yet.</p>
        ) : null}
      </div>

      {/* Column legend */}
      <p className="text-xs text-muted-foreground">
        <span className="font-medium">Crates</span> are calculated using the configured Bottles Per Crate value for each bottle category. &nbsp;
        <span className="font-medium">Water</span> and <span className="font-medium">250 ml</span> scheme totals are summed across all shop orders on this route.
      </p>
    </div>
  )
}

function Metric({ label, value }) {
  return (
    <div className="rounded-lg border bg-card p-3">
      <p className="text-2xl font-black">{value}</p>
      <p className="text-xs font-semibold text-muted-foreground">{label}</p>
    </div>
  )
}

function Cell({ value, strong }) {
  return (
    <div className="border-t p-3 text-right">
      <Badge variant={strong ? 'default' : 'secondary'}>{value}</Badge>
    </div>
  )
}
