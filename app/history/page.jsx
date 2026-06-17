import Link from 'next/link'
import { EnvWarning } from '@/components/env-warning'
import { PageHeader } from '@/components/layout/page-header'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { calculateRouteSummary } from '@/lib/calculations'
import { getHistoryRoutes } from '@/lib/supabase/queries'
import { statusBadgeVariant } from '@/lib/status'
import { formatDate } from '@/lib/utils'

export default async function HistoryPage() {
  const { routes, envMissing } = await getHistoryRoutes()

  return (
    <>
      <PageHeader title="History" subtitle="Past route activity" />
      {envMissing ? <EnvWarning /> : null}
      <section className="space-y-3 p-4">
        {/* History retention behavior explanation */}
        <div className="rounded-md border border-blue-200 bg-blue-50 dark:border-blue-900 dark:bg-blue-950/40 p-3 text-xs text-blue-800 dark:text-blue-300 space-y-1">
          <p className="font-semibold text-blue-900 dark:text-blue-200">🗂️ History &amp; Retention</p>
          <p>This page shows routes within the configured retention period (default: last 7 days). Routes outside this window are not shown.</p>
          <p><span className="font-medium">Auto-Delete:</span> If auto-delete is enabled in App Settings, routes older than the retention period are <span className="font-semibold text-red-700 dark:text-red-400">permanently deleted</span> every time this page is visited. Deleted routes cannot be recovered.</p>
          <p><span className="font-medium">To keep history longer:</span> Go to Settings → App Settings → increase &quot;History retention days&quot; or set &quot;Auto-delete old history&quot; to <code>false</code>.</p>
        </div>
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
                <Button asChild variant="outline" className="mt-3 w-full">
                  <Link href={`/routes/${route.id}`}>View details</Link>
                </Button>
              </CardContent>
            </Card>
          )
        })}
        {!routes.length ? <p className="rounded-lg border bg-card p-4 text-sm text-muted-foreground">No route history yet.</p> : null}
      </section>
    </>
  )
}
