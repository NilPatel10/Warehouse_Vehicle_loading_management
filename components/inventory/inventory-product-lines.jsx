'use client'

import { useState, useMemo } from 'react'
import { Plus, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ProductSelect } from '@/components/routes/product-select'
import { calcCratesAndLoose } from '@/components/inventory/stock-display'

/**
 * InventoryProductLines
 *
 * mode = 'stock'  → quantity label = "Crates", field name = quantity_crates, whole numbers only
 * mode = 'damage' → quantity label = "Bottles", field name = quantity_bottles, whole numbers only
 *
 * Reuses the same ProductSelect searchable combobox used in Vehicle Loading.
 * Already-selected products are hidden from the dropdown.
 */
export function InventoryProductLines({
  products,
  mode = 'stock',
  currentStock = {}, // { product_id: current_stock_bottles } for damage validation
  disabled = false
}) {
  const emptyLine = () => ({ id: crypto.randomUUID(), product_id: '', quantity: '' })
  const [lines, setLines] = useState([emptyLine()])

  const isStock = mode === 'stock'
  const qtyFieldName = isStock ? 'quantity_crates' : 'quantity_bottles'
  const qtyLabel = isStock ? 'Crates' : 'Bottles'

  const selectedProductIds = useMemo(() =>
    lines.map(l => l.product_id).filter(Boolean),
    [lines]
  )

  const addLine = () => setLines(prev => [...prev, emptyLine()])

  const removeLine = (id) => setLines(prev => prev.filter(l => l.id !== id))

  const updateLine = (id, field, value) =>
    setLines(prev =>
      prev.map(l => l.id === id ? { ...l, [field]: value } : l)
    )

  return (
    <div className="space-y-3">
      {lines.map((line, idx) => {
        const product = products.find(p => p.id === line.product_id)
        const bottlesPerCrate = product?.bottle_categories?.bottles_per_crate || 24
        const qty = Number(line.quantity) || 0

        // Equivalent display
        let equivalent = null
        if (isStock && qty > 0 && product) {
          const bottles = qty * bottlesPerCrate
          equivalent = `= ${bottles.toLocaleString()} Bottles`
        }
        if (!isStock && qty > 0 && product) {
          const { crates, loose } = calcCratesAndLoose(qty, bottlesPerCrate)
          equivalent = `${crates} Crates ${loose} Loose`
        }

        // Damage: warn if exceeds stock
        const stockWarning =
          !isStock && product && qty > 0 && (currentStock[line.product_id] || 0) < qty
            ? 'Requested quantity exceeds available stock.'
            : null

        // Exclude all other selected products from this line's dropdown
        const excludeIds = selectedProductIds.filter(pid => pid !== line.product_id)

        return (
          <div key={line.id} className="rounded-lg border bg-card p-3 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                Product {idx + 1}
              </span>
              {lines.length > 1 && (
                <button
                  type="button"
                  onClick={() => removeLine(line.id)}
                  disabled={disabled}
                  className="text-muted-foreground hover:text-destructive transition-colors"
                  aria-label="Remove product line"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              )}
            </div>

            {/* Hidden fields for form submission */}
            <input type="hidden" name="product_id" value={line.product_id} />
            <input type="hidden" name={qtyFieldName} value={line.quantity} />

            <ProductSelect
              products={products}
              value={line.product_id}
              onChange={(val) => updateLine(line.id, 'product_id', val)}
              disabled={disabled}
              excludeIds={excludeIds}
            />

            <div className="space-y-1">
              <Label className="text-xs">{qtyLabel}</Label>
              <Input
                type="number"
                min="1"
                step="1"
                value={line.quantity}
                onChange={(e) => {
                  const raw = e.target.value
                  // Whole numbers only
                  if (raw === '' || /^\d+$/.test(raw)) {
                    updateLine(line.id, 'quantity', raw)
                  }
                }}
                placeholder={`Enter ${qtyLabel.toLowerCase()}...`}
                disabled={disabled || !line.product_id}
                className="h-11"
              />
              {equivalent && (
                <p className="text-xs text-primary font-medium pl-1">{equivalent}</p>
              )}
              {stockWarning && (
                <p className="text-xs text-destructive font-medium pl-1">{stockWarning}</p>
              )}
              {!isStock && product && (
                <p className="text-xs text-muted-foreground pl-1">
                  Available: {(currentStock[line.product_id] || 0).toLocaleString()} Bottles
                </p>
              )}
            </div>
          </div>
        )
      })}

      <Button
        type="button"
        variant="outline"
        className="w-full"
        onClick={addLine}
        disabled={disabled}
      >
        <Plus className="h-4 w-4 mr-2" />
        Add Another Product
      </Button>
    </div>
  )
}
