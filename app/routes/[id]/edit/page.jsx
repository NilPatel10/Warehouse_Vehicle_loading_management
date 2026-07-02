import { notFound, redirect } from 'next/navigation'
import { PageHeader } from '@/components/layout/page-header'
import { RouteEditManager } from '@/components/routes/route-edit-manager'
import { Badge } from '@/components/ui/badge'
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

  if (route.status === 'Dispatched' || route.status === 'Dropped') {
    redirect(`/routes/${route.id}`)
  }

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
        <RouteEditManager
          route={route}
          products={activeProducts}
          userId={user.id}
          timeoutSeconds={Number(lockTimeout) || 180}
        />
      </section>
    </>
  )
}
