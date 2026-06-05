import { notFound, redirect } from 'next/navigation'
import { AddShopOrderForm } from '@/components/routes/add-shop-order-form'
import { PageHeader } from '@/components/layout/page-header'
import { LoadingSummary } from '@/components/routes/loading-summary'
import { RouteLockClient } from '@/components/routes/route-lock-client'
import { ShopOrderList } from '@/components/routes/shop-order-list'
import { StatusActions } from '@/components/routes/status-actions'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { getAppSettingValue, getProductsAndCategories, getRoute } from '@/lib/supabase/queries'
import { statusBadgeVariant } from '@/lib/status'

export default async function RouteEditPage({ params }) {
  const resolvedParams = await params
  const [{ route, user }, { products }, lockTimeout] = await Promise.all([
    getRoute(resolvedParams.id),
    getProductsAndCategories(),
    getAppSettingValue('route_lock_timeout_seconds', '180')
  ])
  if (!user) redirect('/login')
  if (!route) notFound()

  const activeProducts = products.filter((product) => product.is_active && product.bottle_categories?.is_active)

  return (
    <>
      <PageHeader
        title={route.route_name}
        subtitle="Edit route"
        backHref={`/routes/${route.id}`}
        action={<Badge variant={statusBadgeVariant(route.status)}>{route.status}</Badge>}
      />
      <section className="space-y-4 p-4">
        <RouteLockClient routeId={route.id} userId={user.id} timeoutSeconds={Number(lockTimeout) || 180}>
          {({ canEdit }) => (
            <>
              <AddShopOrderForm routeId={route.id} products={activeProducts} disabled={!canEdit} />
              <Card>
                <CardHeader>
                  <CardTitle>Status</CardTitle>
                </CardHeader>
                <CardContent>
                  <StatusActions route={route} disabled={!canEdit} />
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle>Loading summary</CardTitle>
                </CardHeader>
                <CardContent>
                  <LoadingSummary route={route} />
                </CardContent>
              </Card>
              <ShopOrderList route={route} editable={canEdit} />
            </>
          )}
        </RouteLockClient>
      </section>
    </>
  )
}
