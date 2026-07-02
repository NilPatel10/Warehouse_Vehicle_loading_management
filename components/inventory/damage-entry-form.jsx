'use client'

import { useRouter } from 'next/navigation'
import { CalendarDays, AlertTriangle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { InventoryProductLines } from '@/components/inventory/inventory-product-lines'
import { createDamageEntry } from '@/app/warehouse-stock/actions'
import { useFormAction } from '@/lib/hooks/use-form-action'

export function DamageEntryForm({ products, damageReasons, currentStock }) {
  const router = useRouter()
  const today = new Date().toISOString().slice(0, 10)

  // Build stock map: { product_id: current_stock_bottles }
  const stockMap = Object.fromEntries(
    (currentStock || []).map(s => [s.product_id, s.current_stock_bottles])
  )

  const [handleSubmit, isPending] = useFormAction(createDamageEntry, {
    loadingMessage: 'Saving damage entry...',
    successMessage: 'Damage Entry Saved',
    onSuccess: (result) => {
      if (result?.redirect) router.push(result.redirect)
    }
  })

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* Warning banner */}
      <div className="flex items-start gap-2 rounded-md border border-amber-300 bg-amber-50 dark:border-amber-700 dark:bg-amber-950/40 p-3">
        <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
        <p className="text-xs text-amber-700 dark:text-amber-300">
          Damage entries permanently reduce stock. Quantities are in <strong>bottles only</strong>.
          Negative stock is not allowed.
        </p>
      </div>

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

      {/* Damage Reason — mandatory */}
      <div className="space-y-2">
        <Label htmlFor="damage_reason_id">
          Damage Reason <span className="text-destructive">*</span>
        </Label>
        <select
          id="damage_reason_id"
          name="damage_reason_id"
          required
          disabled={isPending}
          suppressHydrationWarning
          className="h-11 w-full rounded-md border border-input bg-background px-3 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <option value="">Select reason...</option>
          {(damageReasons || []).filter(r => r.is_active).map(r => (
            <option key={r.id} value={r.id}>{r.reason_name}</option>
          ))}
        </select>
      </div>

      {/* Products */}
      <div className="space-y-2">
        <Label className="text-sm font-semibold">Damaged Products (Bottles)</Label>
        <p className="text-xs text-muted-foreground">
          Enter quantity in bottles. Current available stock is shown per product.
        </p>
        <InventoryProductLines
          products={products}
          mode="damage"
          currentStock={stockMap}
          disabled={isPending}
        />
      </div>

      {/* Remarks */}
      <div className="space-y-2">
        <Label htmlFor="remarks">Remarks <span className="text-muted-foreground font-normal">(Optional)</span></Label>
        <textarea
          id="remarks"
          name="remarks"
          placeholder="Details about the damage..."
          disabled={isPending}
          rows={3}
          suppressHydrationWarning
          className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-50 disabled:cursor-not-allowed resize-none"
        />
      </div>

      <Button
        type="submit"
        variant="destructive"
        className="w-full h-12 text-base font-semibold"
        loading={isPending}
        loadingText="Saving..."
      >
        Record Damage Entry
      </Button>
    </form>
  )
}
