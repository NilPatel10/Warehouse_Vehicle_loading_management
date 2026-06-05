import { deleteOrderItem, deleteShopOrder } from '@/app/actions'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { calculateItem, calculateShopOrder } from '@/lib/calculations'

export function ShopOrderList({ route, editable = false }) {
  return (
    <div className="space-y-3">
      {(route.shop_orders || []).map((order) => {
        const summary = calculateShopOrder(order)
        return (
          <div key={order.id} className="rounded-lg border bg-card p-3">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="text-base font-bold">{order.shop_name}</h3>
                <p className="text-xs text-muted-foreground">Free water bottle/crate: {order.free_water_per_crate}</p>
              </div>
              <Badge variant="secondary">{summary.fullCrates} crates</Badge>
            </div>
            <div className="mt-3 space-y-2">
              {order.order_items?.map((item) => {
                const itemSummary = calculateItem(item)
                return (
                  <div key={item.id} className="grid grid-cols-[1fr_auto] gap-3 rounded-md bg-muted p-3">
                    <div>
                      <p className="font-semibold">{item.products?.display_name}</p>
                      <p className="text-xs text-muted-foreground">
                        Qty {item.quantity} | {itemSummary.fullCrates} crates | {itemSummary.looseBottles} loose
                      </p>
                    </div>
                    {editable ? (
                      <form action={deleteOrderItem}>
                        <input type="hidden" name="route_id" value={route.id} />
                        <input type="hidden" name="item_id" value={item.id} />
                        <Button variant="ghost" size="sm">Delete</Button>
                      </form>
                    ) : null}
                  </div>
                )
              })}
            </div>
            <div className="mt-3 grid grid-cols-2 gap-2 text-center">
              <MiniMetric label="Free water" value={summary.freeWaterBottles} />
              <MiniMetric label="Free 250 ml" value={summary.free250mlBottles} />
            </div>
            {editable ? (
              <form action={deleteShopOrder} className="mt-3">
                <input type="hidden" name="route_id" value={route.id} />
                <input type="hidden" name="order_id" value={order.id} />
                <Button variant="destructive" className="w-full">Delete shop order</Button>
              </form>
            ) : null}
          </div>
        )
      })}
      {!route.shop_orders?.length ? (
        <p className="rounded-lg border bg-card p-4 text-sm text-muted-foreground">No shop orders added yet.</p>
      ) : null}
    </div>
  )
}

function MiniMetric({ label, value }) {
  return (
    <div className="rounded-md bg-secondary p-2">
      <p className="text-lg font-bold">{value}</p>
      <p className="text-[11px] font-semibold text-muted-foreground">{label}</p>
    </div>
  )
}
