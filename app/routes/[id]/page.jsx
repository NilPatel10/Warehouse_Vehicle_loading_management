import Link from 'next/link'
import { notFound } from 'next/navigation'
import { PageHeader } from '@/components/layout/page-header'
import { LoadingSummary } from '@/components/routes/loading-summary'
import { ShopOrderList } from '@/components/routes/shop-order-list'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { getRoute } from '@/lib/supabase/queries'
import { statusBadgeVariant } from '@/lib/status'
import { formatDate } from '@/lib/utils'
import { RevertToDraftButton } from '@/components/routes/revert-to-draft-button'

export default async function RouteViewPage({ params }) {
  const resolvedParams = await params
  const { route } = await getRoute(resolvedParams.id)
  if (!route) notFound()

  return (
    <>
      <PageHeader
        title={route.route_name}
        subtitle={`${formatDate(route.route_date)} | Read-only view`}
        backHref="/orders"
        action={<Badge variant={statusBadgeVariant(route.status)}>{route.status}</Badge>}
      />
      <section className="space-y-4 p-4">
        {/* Warning Banner */}
        {(route.status === 'Dispatched' || route.status === 'Dropped') && (
          <div className="p-4 rounded-lg border border-yellow-200 bg-yellow-50 dark:bg-yellow-950/40 text-yellow-800 dark:text-yellow-300">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <p className="text-sm font-semibold">
                ⚠️ This route is {route.status.toLowerCase()} and cannot be edited. Change status back to Draft to make changes.
              </p>
              <RevertToDraftButton routeId={route.id} />
            </div>
          </div>
        )}

        <Card>
          <CardHeader>
            <CardTitle>Loading summary</CardTitle>
          </CardHeader>
          <CardContent>
            <LoadingSummary route={route} />
          </CardContent>
        </Card>
        <div className={route.status === 'Dispatched' || route.status === 'Dropped' ? "w-full" : "grid grid-cols-2 gap-2"}>
          <Button asChild variant={route.status === 'Dispatched' || route.status === 'Dropped' ? "default" : "outline"} className="w-full">
            <Link href={`/routes/${route.id}/export`}>Export route</Link>
          </Button>
          {route.status !== 'Dispatched' && route.status !== 'Dropped' && (
            <Button asChild>
              <Link href={`/routes/${route.id}/edit`}>Edit route</Link>
            </Button>
          )}
        </div>
        <ShopOrderList route={route} />
      </section>
    </>
  )
}
