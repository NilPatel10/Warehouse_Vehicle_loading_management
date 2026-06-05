import { notFound } from 'next/navigation'
import { PageHeader } from '@/components/layout/page-header'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ShareRouteExport } from '@/components/routes/share-route-export'
import { Textarea } from '@/components/ui/textarea'
import { getRoute } from '@/lib/supabase/queries'

export default async function RouteExportPage({ params }) {
  const resolvedParams = await params
  const { route } = await getRoute(resolvedParams.id)
  if (!route) notFound()

  const json = JSON.stringify(route, null, 2)

  return (
    <>
      <PageHeader title="Export route" subtitle={route.route_name} backHref={`/routes/${route.id}`} />
      <section className="p-4">
        <Card>
          <CardHeader>
            <CardTitle>Single route JSON backup</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="mb-3">
              <ShareRouteExport routeName={route.route_name} json={json} />
            </div>
            <Textarea readOnly value={json} className="min-h-[60vh] font-mono text-xs" />
          </CardContent>
        </Card>
      </section>
    </>
  )
}
