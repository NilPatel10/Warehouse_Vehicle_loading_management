import { EnvWarning } from '@/components/env-warning'
import { PageHeader } from '@/components/layout/page-header'
import { RoutesOverview } from '@/components/routes/routes-overview'
import { getTodayRoutes } from '@/lib/supabase/queries'

export default async function OrdersPage() {
  const { routes, envMissing } = await getTodayRoutes()

  return (
    <>
      <PageHeader title="Today’s Orders" subtitle="Grouped by loading status" />
      {envMissing ? <EnvWarning /> : null}
      <section className="p-4">
        <RoutesOverview routes={routes} />
      </section>
    </>
  )
}
