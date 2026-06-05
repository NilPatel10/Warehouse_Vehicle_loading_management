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
