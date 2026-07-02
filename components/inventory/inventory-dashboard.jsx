'use client'

import Link from 'next/link'
import { Package, TrendingUp, AlertTriangle, PackageMinus, PackagePlus, ArrowRight, Clock } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { calcCratesAndLoose } from '@/components/inventory/stock-display'

function KpiCard({ icon: Icon, label, value, sub, color = 'primary', href }) {
  const colorMap = {
    primary: 'text-primary',
    green: 'text-emerald-600 dark:text-emerald-400',
    red: 'text-destructive',
    amber: 'text-amber-600 dark:text-amber-400',
    blue: 'text-blue-600 dark:text-blue-400'
  }
  const inner = (
    <Card className="hover:border-primary/40 transition-colors cursor-pointer">
      <CardContent className="p-4 flex items-start gap-3">
        <div className={`mt-0.5 rounded-lg bg-muted p-2 ${colorMap[color]}`}>
          <Icon className="h-5 w-5" />
        </div>
        <div className="min-w-0">
          <p className="text-xs text-muted-foreground font-medium truncate">{label}</p>
          <p className={`text-xl font-bold tabular-nums ${colorMap[color]}`}>{value}</p>
          {sub && <p className="text-xs text-muted-foreground mt-0.5">{sub}</p>}
        </div>
      </CardContent>
    </Card>
  )
  return href ? <Link href={href}>{inner}</Link> : inner
}

function TransactionBadge({ type }) {
  if (type === 'Stock Entry') {
    return <Badge className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400 border-0 text-[10px]">+IN</Badge>
  }
  return <Badge className="bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400 border-0 text-[10px]">-DMG</Badge>
}

export function InventoryDashboard({ data, products }) {
  const {
    totalProducts,
    currentStockBottles,
    todayStockEntries,
    todayDamageEntries,
    recentTransactions,
    lowStockProducts
  } = data

  // Build a product → bottles_per_crate map
  const bpcMap = Object.fromEntries(
    (products || []).map(p => [p.id, p.bottle_categories?.bottles_per_crate || 24])
  )

  const totalCrates = products.reduce((sum, p) => {
    const stock = data.currentStockDetails?.find?.(s => s.product_id === p.id)?.current_stock_bottles || 0
    return sum + Math.floor(stock / (p.bottle_categories?.bottles_per_crate || 24))
  }, 0)

  const { crates, loose } = calcCratesAndLoose(currentStockBottles, 24) // approximate for total across all SKUs

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-2 gap-3">
        <KpiCard
          icon={Package}
          label="Total Products"
          value={totalProducts}
          color="blue"
        />
        <KpiCard
          icon={TrendingUp}
          label="Total Stock"
          value={`${currentStockBottles.toLocaleString()} Btl`}
          sub={`≈ ${crates} Crates`}
          color="primary"
          href="/warehouse-stock/reports"
        />
        <KpiCard
          icon={PackagePlus}
          label="Today's Entries"
          value={todayStockEntries}
          color="green"
          href="/warehouse-stock/entry"
        />
        <KpiCard
          icon={PackageMinus}
          label="Today's Damages"
          value={todayDamageEntries}
          color="red"
          href="/warehouse-stock/damage"
        />
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 gap-3">
        <Link
          href="/warehouse-stock/entry"
          className="flex items-center justify-between rounded-lg border bg-card p-4 hover:border-emerald-400 hover:bg-emerald-50/50 dark:hover:bg-emerald-950/20 transition-colors"
        >
          <div className="flex items-center gap-2">
            <PackagePlus className="h-5 w-5 text-emerald-600" />
            <span className="text-sm font-semibold">Stock Entry</span>
          </div>
          <ArrowRight className="h-4 w-4 text-muted-foreground" />
        </Link>
        <Link
          href="/warehouse-stock/damage"
          className="flex items-center justify-between rounded-lg border bg-card p-4 hover:border-red-400 hover:bg-red-50/50 dark:hover:bg-red-950/20 transition-colors"
        >
          <div className="flex items-center gap-2">
            <PackageMinus className="h-5 w-5 text-destructive" />
            <span className="text-sm font-semibold">Damage Entry</span>
          </div>
          <ArrowRight className="h-4 w-4 text-muted-foreground" />
        </Link>
      </div>

      {/* Low Stock Placeholder */}
      {lowStockProducts.length > 0 && (
        <div className="rounded-lg border border-amber-300 bg-amber-50 dark:border-amber-700 dark:bg-amber-950/30 p-4">
          <div className="flex items-center gap-2 mb-3">
            <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-400" />
            <h3 className="text-sm font-semibold text-amber-800 dark:text-amber-300">
              Low / No Stock ({lowStockProducts.length} Products)
            </h3>
          </div>
          <div className="space-y-2">
            {lowStockProducts.map(p => (
              <div key={p.id} className="flex items-center justify-between">
                <span className="text-xs text-amber-800 dark:text-amber-300 truncate max-w-[60%]">{p.display_name}</span>
                <span className="text-xs font-semibold text-amber-700 dark:text-amber-400 tabular-nums">
                  {p.currentStockBottles} Btl
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recent Transactions */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold flex items-center gap-2">
            <Clock className="h-4 w-4 text-muted-foreground" />
            Recent Transactions
          </h3>
          <Link href="/warehouse-stock/history" className="text-xs text-primary font-medium hover:underline">
            View all
          </Link>
        </div>

        {recentTransactions.length === 0 ? (
          <div className="rounded-lg border bg-card p-6 text-center">
            <p className="text-sm text-muted-foreground">No transactions yet.</p>
            <p className="text-xs text-muted-foreground mt-1">
              Start by creating a <Link href="/warehouse-stock/entry" className="text-primary hover:underline">Stock Entry</Link>.
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {recentTransactions.map(tx => {
              const totalBottles = (tx.inventory_transaction_items || []).reduce(
                (sum, item) => sum + (item.quantity_bottles || 0), 0
              )
              const isEntry = tx.transaction_type === 'Stock Entry'
              return (
                <div key={tx.id} className="rounded-lg border bg-card p-3 flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <TransactionBadge type={tx.transaction_type} />
                      <span className="text-xs font-mono text-muted-foreground">{tx.transaction_number}</span>
                    </div>
                    <p className="text-sm font-semibold truncate">
                      {tx.inventory_transaction_items?.length || 0} product{tx.inventory_transaction_items?.length !== 1 ? 's' : ''}
                    </p>
                    <p className="text-xs text-muted-foreground">{tx.transaction_date}</p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className={`text-sm font-bold tabular-nums ${isEntry ? 'text-emerald-600' : 'text-destructive'}`}>
                      {isEntry ? '+' : '-'}{totalBottles.toLocaleString()} Btl
                    </p>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
