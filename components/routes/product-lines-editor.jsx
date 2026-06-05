'use client'

import { useMemo, useState } from 'react'
import { Plus, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

function newLine() {
  return { key: crypto.randomUUID(), productId: '', quantity: '' }
}

export function ProductLinesEditor({ products, disabled }) {
  const [lines, setLines] = useState([newLine()])
  const [search, setSearch] = useState('')

  const filteredProducts = useMemo(() => {
    const q = search.toLowerCase()
    return products.filter((product) => product.display_name.toLowerCase().includes(q)).slice(0, 20)
  }, [products, search])

  return (
    <div className="space-y-3">
      <div className="space-y-2">
        <Label htmlFor="product-search">Search products</Label>
        <Input
          id="product-search"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Coke 250 ml"
          disabled={disabled}
        />
      </div>
      {lines.map((line, index) => (
        <div key={line.key} className="grid gap-2 rounded-lg border p-3">
          <div className="grid grid-cols-[1fr_96px_auto] gap-2">
            <select
              name="product_id"
              value={line.productId}
              onChange={(event) => {
                const next = [...lines]
                next[index] = { ...line, productId: event.target.value }
                setLines(next)
              }}
              required
              disabled={disabled}
              className="h-11 rounded-md border border-input bg-background px-3 text-sm"
            >
              <option value="">Product</option>
              {filteredProducts.map((product) => (
                <option key={product.id} value={product.id}>
                  {product.display_name}
                </option>
              ))}
            </select>
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
