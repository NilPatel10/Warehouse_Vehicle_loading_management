'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'
import { Input } from '@/components/ui/input'
import { calculateRouteSummary } from '@/lib/calculations'
import { formatDate } from '@/lib/utils'
import { statusBadgeVariant } from '@/lib/status'

function RouteRow({ route }) {
  const summary = calculateRouteSummary(route)

  return (
    <div className="rounded-lg border bg-card p-3">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="truncate text-base font-bold">{route.route_name}</h3>
          <p className="text-sm text-muted-foreground">{formatDate(route.route_date)}</p>
        </div>
        <Badge variant={statusBadgeVariant(route.status)}>{route.status}</Badge>
      </div>
      <div className="mt-3 grid grid-cols-3 gap-2 text-center">
        <div className="rounded-md bg-muted p-2">
          <p className="text-lg font-bold">{summary.totals.fullCrates}</p>
          <p className="text-[11px] text-muted-foreground">Crates</p>
        </div>
        <div className="rounded-md bg-muted p-2">
          <p className="text-lg font-bold">{summary.totals.looseBottles}</p>
          <p className="text-[11px] text-muted-foreground">Loose</p>
        </div>
        <div className="rounded-md bg-muted p-2">
          <p className="text-lg font-bold">{route.shop_orders?.length || 0}</p>
          <p className="text-[11px] text-muted-foreground">Shops</p>
        </div>
      </div>
      <div className="mt-3 border-t pt-3 grid grid-cols-2 gap-2 text-left">
        <div>
          <p className="text-xs font-semibold text-muted-foreground">Free Water</p>
          <p className="text-sm font-bold text-foreground">{summary.totals.freeWaterBottles} Bottles</p>
          <p className="text-xs text-muted-foreground">{summary.totals.freeWaterCrates} Crates</p>
        </div>
        <div>
          <p className="text-xs font-semibold text-muted-foreground">Free 250ml</p>
          <p className="text-sm font-bold text-foreground">{summary.totals.free250mlBottles} Bottles</p>
          <p className="text-xs text-muted-foreground">{summary.totals.free250mlCrates} Crates</p>
        </div>
      </div>
      <div className="mt-3 grid grid-cols-2 gap-2">
        <Button asChild variant="outline">
          <Link href={`/routes/${route.id}`}>View</Link>
        </Button>
        <Button asChild>
          <Link href={`/routes/${route.id}/edit`}>Edit</Link>
        </Button>
      </div>
    </div>
  )
}

export function RoutesOverview({ routes }) {
  const [search, setSearch] = useState('')
  const [expandedItems, setExpandedItems] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('routes_overview_expanded')
      return saved ? JSON.parse(saved) : ['draft', 'ready', 'overdue']
    }
    return ['draft', 'ready', 'overdue']
  })

  useEffect(() => {
    localStorage.setItem('routes_overview_expanded', JSON.stringify(expandedItems))
  }, [expandedItems])

  const filteredRoutes = useMemo(() => {
    const q = search.toLowerCase()
    return routes.filter(
      (route) => route.route_name.toLowerCase().includes(q) || route.route_date.includes(q)
    )
  }, [routes, search])

  const now = new Date()
  const today = now.toISOString().slice(0, 10)
  const draftRoutes = filteredRoutes.filter((route) => route.status === 'Draft' && route.route_date >= today)
  const readyRoutes = filteredRoutes.filter((route) => route.status === 'Ready To Load' && route.route_date >= today)
  const overdueRoutes = filteredRoutes.filter((route) => route.route_date < today && !['Dispatched', 'Dropped'].includes(route.status))

  const sections = [
    { id: 'draft', title: 'Draft routes', routes: draftRoutes },
    { id: 'ready', title: 'Ready to Load routes', routes: readyRoutes },
    { id: 'overdue', title: 'Overdue routes', routes: overdueRoutes }
  ]

  return (
    <div className="space-y-4">
      <Input
        placeholder="Filter routes by name or date (YYYY-MM-DD)..."
        value={search}
        onChange={(event) => setSearch(event.target.value)}
        className="w-full bg-card"
      />
      <Accordion type="multiple" value={expandedItems} onValueChange={setExpandedItems} className="space-y-3">
      {sections.map((section) => (
        <AccordionItem key={section.id} value={section.id} className="rounded-lg border bg-card px-3">
          <AccordionTrigger className="text-base">
            <span>{section.title}</span>
            <Badge variant={section.id === 'overdue' ? 'destructive' : 'secondary'} className="mr-2">
              {section.routes.length}
            </Badge>
          </AccordionTrigger>
          <AccordionContent className="space-y-3">
            {section.routes.length ? section.routes.map((route) => <RouteRow key={route.id} route={route} />) : (
              <p className="rounded-md bg-muted p-3 text-sm text-muted-foreground">No routes in this section.</p>
            )}
          </AccordionContent>
        </AccordionItem>
      ))}
    </Accordion>
    </div>
  )
}
