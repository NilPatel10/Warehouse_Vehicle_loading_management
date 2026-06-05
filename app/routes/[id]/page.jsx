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
        <Card>
          <CardHeader>
            <CardTitle>Loading summary</CardTitle>
          </CardHeader>
          <CardContent>
            <LoadingSummary route={route} />
          </CardContent>
        </Card>
        <div className="grid grid-cols-2 gap-2">
          <Button asChild variant="outline">
            <Link href={`/routes/${route.id}/export`}>Export route</Link>
          </Button>
          <Button asChild>
            <Link href={`/routes/${route.id}/edit`}>Edit route</Link>
          </Button>
        </div>
        <ShopOrderList route={route} />
      </section>
    </>
  )
}
