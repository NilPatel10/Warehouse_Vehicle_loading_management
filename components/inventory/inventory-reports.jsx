'use client'

import { useState } from 'react'
import { BarChart3, PackagePlus, PackageMinus } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'

function TabButton({ active, onClick, children, icon: Icon }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold border transition-all ${
        active
          ? 'bg-primary text-primary-foreground border-primary'
          : 'border-border text-muted-foreground hover:border-primary/40 hover:text-foreground'
      }`}
    >
      <Icon className="h-3.5 w-3.5" />
      {children}
    </button>
  )
}

function CurrentStockTable({ currentStock }) {
  const [search, setSearch] = useState('')
  const filtered = currentStock.filter(p =>
    p.display_name.toLowerCase().includes(search.toLowerCase())
  )
  const grandTotal = currentStock.reduce((s, p) => s + p.total_bottles, 0)

  return (
    <div className="space-y-3">
      <Input
        placeholder="Search product..."
        value={search}
        onChange={e => setSearch(e.target.value)}
      />
      <div className="rounded-md border overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-muted/60">
            <tr>
              <th className="text-left p-3 text-xs font-semibold text-muted-foreground">Product</th>
              <th className="text-right p-3 text-xs font-semibold text-muted-foreground">Bottles</th>
              <th className="text-right p-3 text-xs font-semibold text-muted-foreground">Crates</th>
              <th className="text-right p-3 text-xs font-semibold text-muted-foreground">Loose</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((p, i) => (
              <tr key={p.product_id} className={i % 2 === 0 ? '' : 'bg-muted/20'}>
                <td className="p-3 font-medium text-sm">{p.display_name}</td>
                <td className="p-3 text-right tabular-nums">{p.total_bottles.toLocaleString()}</td>
                <td className="p-3 text-right tabular-nums">{p.crates}</td>
                <td className="p-3 text-right tabular-nums">{p.loose_bottles}</td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={4} className="p-6 text-center text-muted-foreground text-sm">
                  No products found.
                </td>
              </tr>
            )}
          </tbody>
          <tfoot className="border-t bg-muted/40">
            <tr>
              <td className="p-3 font-bold text-sm">Total</td>
              <td className="p-3 text-right font-bold tabular-nums">{grandTotal.toLocaleString()}</td>
              <td colSpan={2} className="p-3 text-right text-xs text-muted-foreground">Btl</td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  )
}

function TransactionTable({ transactions, type }) {
  const [search, setSearch] = useState('')
  const isEntry = type === 'entry'

  const filtered = transactions.filter(tx => {
    const q = search.toLowerCase()
    if (!q) return true
    return (
      (tx.transaction_number || '').toLowerCase().includes(q) ||
      (tx.transaction_date || '').includes(q) ||
      (tx.inventory_transaction_items || []).some(item =>
        (item.products?.display_name || '').toLowerCase().includes(q)
      )
    )
  })

  return (
    <div className="space-y-3">
      <Input
        placeholder="Search by number, date, or product..."
        value={search}
        onChange={e => setSearch(e.target.value)}
      />
      {filtered.length === 0 ? (
        <div className="rounded-lg border p-6 text-center text-sm text-muted-foreground">
          No {isEntry ? 'stock entries' : 'damage entries'} found.
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map(tx => {
            const items = tx.inventory_transaction_items || []
            const totalBottles = items.reduce((s, i) => s + (i.quantity_bottles || 0), 0)
            return (
              <div key={tx.id} className="rounded-lg border bg-card p-3 space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <div>
                    <p className="text-xs font-mono text-muted-foreground">{tx.transaction_number}</p>
                    <p className="text-sm font-semibold">{tx.transaction_date}</p>
                    {!isEntry && tx.damage_reasons && (
                      <Badge className="mt-1 bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400 border-0 text-[10px]">
                        {tx.damage_reasons.reason_name}
                      </Badge>
                    )}
                  </div>
                  <p className={`text-base font-bold tabular-nums ${isEntry ? 'text-emerald-600' : 'text-destructive'}`}>
                    {isEntry ? '+' : '-'}{totalBottles.toLocaleString()} Btl
                  </p>
                </div>
                <div className="space-y-1">
                  {items.map(item => {
                    const bpc = item.products?.bottle_categories?.bottles_per_crate || 24
                    const crates = Math.floor(item.quantity_bottles / bpc)
                    const loose = item.quantity_bottles % bpc
                    return (
                      <div key={item.id} className="flex justify-between text-xs text-muted-foreground">
                        <span>{item.products?.display_name}</span>
                        <span>{item.quantity_bottles} Btl ({crates}C {loose}L)</span>
                      </div>
                    )
                  })}
                </div>
                {(tx.remarks || tx.reference_number) && (
                  <p className="text-xs text-muted-foreground border-t pt-1">
                    {tx.reference_number && <>Ref: {tx.reference_number} </>}
                    {tx.remarks && <>· {tx.remarks}</>}
                  </p>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

export function InventoryReports({ currentStock, stockEntries, damages }) {
  const [tab, setTab] = useState('stock')

  return (
    <div className="space-y-4">
      {/* Tab Switcher */}
      <div className="flex gap-2 flex-wrap">
        <TabButton active={tab === 'stock'} onClick={() => setTab('stock')} icon={BarChart3}>
          Current Stock
        </TabButton>
        <TabButton active={tab === 'entries'} onClick={() => setTab('entries')} icon={PackagePlus}>
          Stock Entries
        </TabButton>
        <TabButton active={tab === 'damage'} onClick={() => setTab('damage')} icon={PackageMinus}>
          Damage History
        </TabButton>
      </div>

      {tab === 'stock' && <CurrentStockTable currentStock={currentStock} />}
      {tab === 'entries' && <TransactionTable transactions={stockEntries} type="entry" />}
      {tab === 'damage' && <TransactionTable transactions={damages} type="damage" />}
    </div>
  )
}
