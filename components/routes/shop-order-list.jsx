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
                const isItemDeleting = deleteItemPending && deletingItemId === item.id
                
                return (
                  <div key={item.id} className="grid grid-cols-[1fr_auto] gap-3 rounded-md bg-muted p-3">
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
                )
              })}
            </div>
            <div className="mt-3 grid grid-cols-2 gap-2 text-center">
              <MiniMetric label="Free water" value={summary.freeWaterBottles} />
              <MiniMetric label="Free 250 ml" value={summary.free250mlBottles} />
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
