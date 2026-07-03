'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { CalendarDays } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { InventoryProductLines } from '@/components/inventory/inventory-product-lines'
import { createStockEntry } from '@/app/warehouse-stock/actions'
import { useFormAction } from '@/lib/hooks/use-form-action'

export function StockEntryForm({ products }) {
  const router = useRouter()
  const today = new Date().toISOString().slice(0, 10)
  const formRef = useRef(null)
  const [formKey, setFormKey] = useState(0)

  const [handleSubmit, isPending] = useFormAction(createStockEntry, {
    loadingMessage: 'Saving stock entry...',
    successMessage: 'Stock Entry Saved',
    onSuccess: (result) => {
      setFormKey((prev) => prev + 1)
      setTimeout(() => {
        const firstInput = formRef.current?.querySelector('[name="transaction_date"]')
        if (firstInput) firstInput.focus()
      }, 0)
      if (result?.redirect) router.push(result.redirect)
    }
  })

  return (
    <form ref={formRef} key={formKey} onSubmit={handleSubmit} className="space-y-5">
      {/* Transaction Date */}
      <div className="space-y-2">
        <Label htmlFor="transaction_date" className="flex items-center gap-2">
          <CalendarDays className="h-4 w-4 text-muted-foreground" />
          Transaction Date
        </Label>
        <Input
          id="transaction_date"
          name="transaction_date"
          type="date"
          defaultValue={today}
          required
          disabled={isPending}
          className="h-11"
        />
      </div>

      {/* Products */}
      <div className="space-y-2">
        <Label className="text-sm font-semibold">Products (Crates Received)</Label>
        <p className="text-xs text-muted-foreground">
          Enter full crates only. System converts to bottles automatically using product configuration.
        </p>
        <InventoryProductLines products={products} mode="stock" disabled={isPending} />
      </div>

      {/* Reference Number */}
      <div className="space-y-2">
        <Label htmlFor="reference_number">Reference Number <span className="text-muted-foreground font-normal">(Optional)</span></Label>
        <Input
          id="reference_number"
          name="reference_number"
          placeholder="e.g. Invoice #, Delivery Note #..."
          disabled={isPending}
          className="h-11"
        />
      </div>

      {/* Remarks */}
      <div className="space-y-2">
        <Label htmlFor="remarks">Remarks <span className="text-muted-foreground font-normal">(Optional)</span></Label>
        <textarea
          id="remarks"
          name="remarks"
          placeholder="Any additional notes..."
          disabled={isPending}
          rows={3}
          suppressHydrationWarning
          className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-50 disabled:cursor-not-allowed resize-none"
        />
      </div>

      <Button
        type="submit"
        className="w-full h-12 text-base font-semibold"
        loading={isPending}
        loadingText="Saving..."
      >
        Save Stock Entry
      </Button>
    </form>
  )
}
