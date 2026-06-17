'use client'

import { useState } from 'react'
import { deleteOrderItem, deleteShopOrder } from '@/app/actions'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { calculateItem, calculateShopOrder } from '@/lib/calculations'
import { useFormAction } from '@/lib/hooks/use-form-action'

export function ShopOrderList({ route, editable = false, onEditOrder }) {
  const [deletingItemId, setDeletingItemId] = useState(null)
  const [deletingOrderId, setDeletingOrderId] = useState(null)

  const [handleDeleteItem, deleteItemPending] = useFormAction(deleteOrderItem, {
    loadingMessage: 'Deleting item...',
    successMessage: 'Item deleted.',
    onSuccess: () => setDeletingItemId(null)
  })

  const [handleDeleteOrder, deleteOrderPending] = useFormAction(deleteShopOrder, {
    loadingMessage: 'Deleting shop order...',
    successMessage: 'Shop order deleted.',
    onSuccess: () => setDeletingOrderId(null)
  })

  const onDeleteItem = async (itemId) => {
    setDeletingItemId(itemId)
    const formData = new FormData()
    formData.append('route_id', route.id)
    formData.append('item_id', itemId)
    try {
      await handleDeleteItem(formData)
    } finally {
      setDeletingItemId(null)
    }
  }

  const onDeleteOrder = async (orderId) => {
    if (!confirm('Are you sure you want to delete this entire shop order?')) return
    setDeletingOrderId(orderId)
    const formData = new FormData()
    formData.append('route_id', route.id)
    formData.append('order_id', orderId)
    try {
      await handleDeleteOrder(formData)
    } finally {
      setDeletingOrderId(null)
    }
  }

  return (
    <div className="space-y-3">
      {(route.shop_orders || []).map((order) => {
        const summary = calculateShopOrder(order)
        const isOrderDeleting = deleteOrderPending && deletingOrderId === order.id

        const isManualScheme = summary.waterSchemeSource === 'manual'
        const schemeLabel = isManualScheme ? 'Manual Override' : 'Category Configuration'
        const schemeIcon = isManualScheme ? '🔧' : '⚙️'

        return (
          <div key={order.id} className="rounded-lg border bg-card p-3">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="text-base font-bold">{order.shop_name}</h3>
                <p className="text-xs text-muted-foreground">
                  Water scheme source:{' '}
                  <span className="font-medium">
                    {schemeIcon} {schemeLabel}
                  </span>
                </p>
              </div>
              <Badge variant="secondary">{summary.fullCrates} crates</Badge>
            </div>

            <div className="mt-3 space-y-2">
              {order.order_items?.map((item) => {
                const itemSummary = calculateItem(item)
                const isItemDeleting = deleteItemPending && deletingItemId === item.id
                const free250PerBottle = Number(item.products?.bottle_categories?.free_250ml_per_crate || 0)
                const free250Enabled = Boolean(item.products?.bottle_categories?.free_250ml_enabled)
                const manualWaterPerCrate = Number(order.free_water_per_crate || 0)
                const categoryWaterPerCrate = Number(item.products?.bottle_categories?.water_bottles_per_crate || 0)
                const effectiveWaterPerCrate = isManualScheme ? manualWaterPerCrate : categoryWaterPerCrate
                const itemWater = itemSummary.fullCrates * effectiveWaterPerCrate

                return (
                  <div key={item.id} className="rounded-md bg-muted p-3 space-y-2">
                    <div className="grid grid-cols-[1fr_auto] gap-3">
                      <div>
                        <p className="font-semibold">{item.products?.display_name}</p>
                        <p className="text-xs text-muted-foreground">
                          Qty {item.quantity} | {itemSummary.fullCrates} crates | {itemSummary.looseBottles} loose
                        </p>
                      </div>
                      {editable ? (
                        <Button
                          variant="ghost"
                          size="sm"
                          loading={isItemDeleting}
                          disabled={deleteItemPending || deleteOrderPending}
                          onClick={() => onDeleteItem(item.id)}
                        >
                          Delete
                        </Button>
                      ) : null}
                    </div>

                    {/* Per-item calculation breakdown */}
                    <div className="rounded-md border bg-background px-3 py-2 text-xs space-y-1 text-muted-foreground">
                      <p className="font-semibold text-foreground">Calculation breakdown:</p>
                      <p>
                        <span className="font-medium text-foreground">Full crates:</span>{' '}
                        {item.quantity} ÷ {itemSummary.bottlesPerCrate} (bottles/crate) = <span className="font-bold text-foreground">{itemSummary.fullCrates} crates</span>
                        {itemSummary.looseBottles > 0 ? ` + ${itemSummary.looseBottles} loose` : ''}
                      </p>
                      {/* Water breakdown — single scheme only */}
                      <p>
                        <span className="font-medium text-foreground">
                          Water ({isManualScheme ? 'manual override' : 'category default'}):
                        </span>{' '}
                        {itemSummary.fullCrates} crates × {effectiveWaterPerCrate}/crate ={' '}
                        <span className="font-bold text-foreground">{itemWater}</span>
                      </p>
                      {/* 250ml breakdown */}
                      {free250Enabled ? (
                        <p>
                          <span className="font-medium text-foreground">Free 250ml:</span>{' '}
                          {item.quantity} bottles × {free250PerBottle}/bottle = <span className="font-bold text-foreground">{itemSummary.free250mlBottles}</span>
                        </p>
                      ) : null}
                    </div>
                  </div>
                )
              })}
            </div>

            {/* Order totals */}
            <div className="mt-3 space-y-2">
              <div className="grid grid-cols-2 gap-2 text-center">
                <MiniMetric label="Free water (total)" value={summary.freeWaterBottles} />
                <MiniMetric label="Free 250 ml" value={summary.free250mlBottles} />
              </div>

              {/* Water scheme summary footer */}
              {summary.effectiveWaterPerCrate > 0 && (
                <div className="rounded-md border border-border bg-muted/40 px-3 py-2 text-xs space-y-1 text-muted-foreground">
                  <p className="font-semibold text-foreground">
                    {schemeIcon} Water Scheme Source:{' '}
                    <span className={isManualScheme ? 'text-blue-600 dark:text-blue-400' : 'text-green-600 dark:text-green-400'}>
                      {schemeLabel}
                    </span>
                  </p>
                  <p>
                    💧{' '}
                    <span className="font-bold text-foreground">{summary.fullCrates}</span> crates ×{' '}
                    <span className="font-bold text-foreground">{summary.effectiveWaterPerCrate}</span> bottles/crate ={' '}
                    <span className="font-bold text-foreground">{summary.freeWaterBottles}</span> free water bottles
                  </p>
                </div>
              )}
            </div>

            {editable ? (
              <div className="mt-3 grid grid-cols-2 gap-2">
                <Button
                  type="button"
                  variant="outline"
                  disabled={deleteItemPending || deleteOrderPending}
                  onClick={() => onEditOrder && onEditOrder(order)}
                >
                  Edit order
                </Button>
                <Button
                  variant="destructive"
                  loading={isOrderDeleting}
                  disabled={deleteItemPending || deleteOrderPending}
                  onClick={() => onDeleteOrder(order.id)}
                >
                  Delete order
                </Button>
              </div>
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
