'use client'

import { useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { calcCratesAndLoose } from '@/components/inventory/stock-display'

function TransactionBadge({ type }) {
  if (type === 'Stock Entry') {
    return (
      <Badge className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400 border-0">
        Stock Entry
      </Badge>
    )
  }
  return (
    <Badge className="bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400 border-0">
      Damage Entry
    </Badge>
  )
}

function TransactionCard({ tx }) {
  const [expanded, setExpanded] = useState(false)
  const items = tx.inventory_transaction_items || []
  const isEntry = tx.transaction_type === 'Stock Entry'

  const totalBottles = items.reduce((sum, item) => sum + (item.quantity_bottles || 0), 0)

  return (
    <div className="rounded-lg border bg-card overflow-hidden">
      {/* Header */}
      <button
        type="button"
        className="w-full text-left p-4 hover:bg-muted/30 transition-colors"
        onClick={() => setExpanded(prev => !prev)}
      >
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1 space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <TransactionBadge type={tx.transaction_type} />
              <span className="text-xs font-mono text-muted-foreground">{tx.transaction_number}</span>
            </div>
            <p className="text-sm font-semibold">
              {items.length} product{items.length !== 1 ? 's' : ''}
              {tx.damage_reasons?.reason_name && (
                <span className="text-muted-foreground font-normal ml-2">— {tx.damage_reasons.reason_name}</span>
              )}
            </p>
            <p className="text-xs text-muted-foreground">{tx.transaction_date}</p>
          </div>
          <div className="text-right flex-shrink-0">
            <p className={`text-base font-bold tabular-nums ${isEntry ? 'text-emerald-600' : 'text-destructive'}`}>
              {isEntry ? '+' : '-'}{totalBottles.toLocaleString()} Btl
            </p>
            <p className="text-[10px] text-muted-foreground mt-0.5">{expanded ? '▲ hide' : '▼ details'}</p>
          </div>
        </div>
      </button>

      {/* Expanded Details */}
      {expanded && (
        <div className="border-t bg-muted/10 p-4 space-y-3">
          {/* Products breakdown */}
          <div className="space-y-2">
            {items.map(item => {
              const bpc = item.products?.bottle_categories?.bottles_per_crate || 24
              const { crates, loose } = calcCratesAndLoose(item.quantity_bottles, bpc)
              const { crates: afterCrates, loose: afterLoose } = calcCratesAndLoose(item.stock_after_bottles, bpc)
              return (
                <div key={item.id} className="rounded-md border bg-card p-3 text-sm">
                  <p className="font-semibold">{item.products?.display_name || 'Unknown'}</p>
                  <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                    <span>
                      <span className={isEntry ? 'text-emerald-600' : 'text-destructive'}>
                        {isEntry ? '+' : '-'}{item.quantity_bottles} Btl
                      </span>
                      {' '}({isEntry ? '+' : '-'}{crates}C {loose}L)
                    </span>
                    <span className="text-foreground font-medium">
                      Stock after: {item.stock_after_bottles} Btl ({afterCrates}C {afterLoose}L)
                    </span>
                  </div>
                </div>
              )
            })}
          </div>

          {/* Meta */}
          <div className="text-xs text-muted-foreground space-y-1 border-t pt-2">
            {tx.reference_number && <p>Ref: {tx.reference_number}</p>}
            {tx.remarks && <p>Remarks: {tx.remarks}</p>}
            {tx.created_by_user && (
              <p>By: {tx.created_by_user.full_name || tx.created_by_user.email}</p>
            )}
            <p>Created: {new Date(tx.created_at).toLocaleString()}</p>
          </div>
        </div>
      )}
    </div>
  )
}

export function InventoryHistoryList({ transactions }) {
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState('all')

  const filtered = (transactions || []).filter(tx => {
    if (filter === 'entry' && tx.transaction_type !== 'Stock Entry') return false
    if (filter === 'damage' && tx.transaction_type !== 'Damage Entry') return false
    if (search) {
      const q = search.toLowerCase()
      const matchTxNum = (tx.transaction_number || '').toLowerCase().includes(q)
      const matchProducts = (tx.inventory_transaction_items || []).some(
        item => (item.products?.display_name || '').toLowerCase().includes(q)
      )
      const matchReason = (tx.damage_reasons?.reason_name || '').toLowerCase().includes(q)
      if (!matchTxNum && !matchProducts && !matchReason) return false
    }
    return true
  })

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="space-y-2">
        <Input
          placeholder="Search by transaction number or product..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
        <div className="flex gap-2">
          {[['all', 'All'], ['entry', 'Stock Entry'], ['damage', 'Damage']].map(([val, label]) => (
            <button
              key={val}
              type="button"
              onClick={() => setFilter(val)}
              className={`px-3 py-1 rounded-full text-xs font-semibold border transition-colors ${
                filter === val
                  ? 'bg-primary text-primary-foreground border-primary'
                  : 'border-border text-muted-foreground hover:border-primary/50'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Transactions */}
      {filtered.length === 0 ? (
        <div className="rounded-lg border bg-card p-8 text-center">
          <p className="text-sm text-muted-foreground">No transactions found.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map(tx => (
            <TransactionCard key={tx.id} tx={tx} />
          ))}
        </div>
      )}
    </div>
  )
}
