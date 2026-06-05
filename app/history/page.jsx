import { EnvWarning } from '@/components/env-warning'
import { PageHeader } from '@/components/layout/page-header'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { calculateRouteSummary } from '@/lib/calculations'
import { getHistoryRoutes } from '@/lib/supabase/queries'
import { statusBadgeVariant } from '@/lib/status'
import { formatDate } from '@/lib/utils'

export default async function HistoryPage() {
  const { routes, envMissing } = await getHistoryRoutes()

  return (
    <>
      <PageHeader title="History" subtitle="Last 7 days of route activity" />
      {envMissing ? <EnvWarning /> : null}
      <section className="space-y-3 p-4">
        {routes.map((route) => {
          const summary = calculateRouteSummary(route)
          return (
            <Card key={route.id}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h2 className="truncate text-base font-bold">{route.route_name}</h2>
                    <p className="text-sm text-muted-foreground">{formatDate(route.route_date)}</p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      Created by {route.created_by_user?.full_name || route.created_by_user?.email || 'staff'} | Last edited by {route.updated_by_user?.full_name || route.updated_by_user?.email || 'staff'}
                    </p>
                  </div>
                  <Badge variant={statusBadgeVariant(route.status)}>{route.status}</Badge>
                </div>
                <div className="mt-3 grid grid-cols-3 gap-2 text-center">
                  <div className="rounded-md bg-muted p-2">
                    <p className="font-bold">{summary.totals.fullCrates}</p>
                    <p className="text-[11px] text-muted-foreground">Crates</p>
                  </div>
                  <div className="rounded-md bg-muted p-2">
                    <p className="font-bold">{summary.totals.freeWaterBottles}</p>
                    <p className="text-[11px] text-muted-foreground">Water</p>
                  </div>
                  <div className="rounded-md bg-muted p-2">
                    <p className="font-bold">{summary.totals.free250mlBottles}</p>
                    <p className="text-[11px] text-muted-foreground">250 ml</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )
        })}
        {!routes.length ? <p className="rounded-lg border bg-card p-4 text-sm text-muted-foreground">No route history yet.</p> : null}
      </section>
    </>
  )
}
