'use client'

import { useState } from 'react'
import { Plus, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ProductSelect } from '@/components/routes/product-select'

function newLine() {
  return { key: crypto.randomUUID(), productId: '', quantity: '' }
}

export function ProductLinesEditor({ products, disabled, initialItems }) {
  const [lines, setLines] = useState(() => {
    if (initialItems && initialItems.length > 0) {
      return initialItems.map((item) => ({
        key: crypto.randomUUID(),
        productId: item.product_id,
        quantity: String(item.quantity)
      }))
    }
    return [newLine()]
  })

  return (
    <div className="space-y-3">
      {lines.map((line, index) => (
        <div key={line.key} className="grid gap-2 rounded-lg border p-3">
          <div className="grid grid-cols-[1fr_96px_auto] gap-2">
            <ProductSelect
              products={products}
              value={line.productId}
              onChange={(productId) => {
                const next = [...lines]
                next[index] = { ...line, productId }
                setLines(next)
              }}
              disabled={disabled}
              excludeIds={lines.map((l) => l.productId).filter((id) => id && id !== line.productId)}
            />
            <Input
              name="quantity"
              type="number"
              min="1"
              placeholder="Qty"
              value={line.quantity}
              onChange={(event) => {
                const next = [...lines]
                next[index] = { ...line, quantity: event.target.value }
                setLines(next)
              }}
              required
              disabled={disabled}
            />
            <Button
              type="button"
              variant="ghost"
              size="icon"
              aria-label="Remove product line"
              disabled={disabled || lines.length === 1}
              onClick={() => setLines(lines.filter((candidate) => candidate.key !== line.key))}
            >
              <Trash2 />
            </Button>
          </div>
        </div>
      ))}
      <Button type="button" variant="outline" className="w-full" disabled={disabled} onClick={() => setLines([...lines, newLine()])}>
        <Plus /> Add product
      </Button>
    </div>
  )
}
