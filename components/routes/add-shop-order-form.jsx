'use client'

import { useState } from 'react'
import { addShopOrder } from '@/app/actions'
import { ProductLinesEditor } from '@/components/routes/product-lines-editor'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useFormAction } from '@/lib/hooks/use-form-action'
import { toast } from 'sonner'

export function AddShopOrderForm({ routeId, products, disabled, editingOrder, onCancelEdit }) {
  const [formKey, setFormKey] = useState(0)
  const isEditing = !!editingOrder

  const [handleSaveOrder, isPending] = useFormAction(addShopOrder, {
    loadingMessage: isEditing ? 'Updating shop order...' : 'Saving shop order...',
    successMessage: isEditing ? 'Shop Order Updated' : 'Shop Order Saved',
    onSuccess: () => {
      if (onCancelEdit) onCancelEdit()
      setFormKey((prev) => prev + 1)
    }
  })

  const formDisabled = disabled || isPending

  const handleSubmit = (event) => {
    event.preventDefault()
    const formData = new FormData(event.currentTarget)
    const productIds = formData.getAll('product_id').map(String).filter(Boolean)
    const quantities = formData.getAll('quantity').map((value) => Number(value || 0))

    const activeProductIds = []
    for (let i = 0; i < productIds.length; i++) {
      if (quantities[i] > 0) {
        activeProductIds.push(productIds[i])
      }
    }

    const uniqueProductIds = new Set(activeProductIds)
    if (uniqueProductIds.size !== activeProductIds.length) {
      toast.error("Product already added to this shop order. Please update the existing quantity.")
      return
    }

    handleSaveOrder(event)
  }

  return (
    <Card key={`${editingOrder?.id || 'new'}-${formKey}`}>
      <CardHeader>
        <CardTitle>{isEditing ? `Edit shop order: ${editingOrder.shop_name}` : 'Add shop order'}</CardTitle>
      </CardHeader>
      <CardContent>
        <form id="add-shop-order-form" onSubmit={handleSubmit} className="space-y-4">
          <input type="hidden" name="route_id" value={routeId} />
          {isEditing ? <input type="hidden" name="order_id" value={editingOrder.id} /> : null}
          <div className="space-y-2">
            <Label htmlFor="shop_name">Shop name</Label>
            <Input
              id="shop_name"
              name="shop_name"
              placeholder="Shree Beverages"
              defaultValue={editingOrder?.shop_name || ''}
              required
              disabled={formDisabled}
            />
          </div>
          <ProductLinesEditor products={products} disabled={formDisabled} initialItems={editingOrder?.order_items} />

          {/* Quantity interpretation note */}
          <p className="rounded-md bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 px-3 py-2 text-xs text-amber-800 dark:text-amber-300">
            ℹ️ <span className="font-semibold">Quantities represent individual bottles, not crates.</span> The system automatically calculates full crates and loose bottles based on the configured Bottles Per Crate value for each product&apos;s category.
          </p>

          {/* Duplicate product prevention note */}
          <p className="rounded-md bg-muted px-3 py-2 text-xs text-muted-foreground">
            A product can only be added once within a single shop order. Update the quantity instead of creating duplicate entries.
          </p>

          <div className="space-y-2">
            <Label htmlFor="free_water_per_crate">Free water bottles per crate</Label>
            <Input
              id="free_water_per_crate"
              name="free_water_per_crate"
              type="number"
              min="0"
              defaultValue={editingOrder?.free_water_per_crate ?? 0}
              disabled={formDisabled}
            />
          </div>

          {/* Free water explanation note */}
          <p className="rounded-md bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 px-3 py-2 text-xs text-blue-800 dark:text-blue-300">
            💧 <span className="font-semibold">Free Water Calculation:</span> Enter how many free water bottles are given per full crate in this order. Only full crates count — loose bottles do not earn free water.
            <br />
            <span className="font-medium">Example:</span> 18 bottles of 2.25L (9 per crate) = 2 full crates. Water scheme = 3 → <strong>6 free water bottles</strong>.
          </p>
          <p className="rounded-md border border-orange-300 bg-orange-50 dark:border-orange-700 dark:bg-orange-950/40 px-3 py-2 text-xs text-orange-800 dark:text-orange-300">
            ⚠️ <span className="font-semibold">Important:</span> This manual water scheme is <span className="font-semibold">added on top of</span> any category-level water bonus configured in Settings → Bottle Categories → &quot;Water bottles per full crate&quot;. If that category field is non-zero, do not also enter water here — or both will count together.
          </p>

          <div className="flex gap-2">
            {isEditing ? (
              <Button type="button" variant="outline" className="w-1/3" disabled={formDisabled} onClick={onCancelEdit}>
                Cancel
              </Button>
            ) : null}
            <Button type="submit" className="flex-1" loading={isPending} loadingText={isEditing ? 'Updating' : 'Saving'} disabled={disabled}>
              {isEditing ? 'Update shop order' : 'Save shop order'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
