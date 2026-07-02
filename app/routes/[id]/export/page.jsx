import { notFound } from 'next/navigation'
import { PageHeader } from '@/components/layout/page-header'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ShareRouteExport } from '@/components/routes/share-route-export'
import { Textarea } from '@/components/ui/textarea'
import { getRoute } from '@/lib/supabase/queries'
import { calculateRouteSummary } from '@/lib/calculations'

export default async function RouteExportPage({ params }) {
  const resolvedParams = await params
  const { route } = await getRoute(resolvedParams.id)
  if (!route) notFound()

  // Calculate calculations summary dynamically
  const summary = calculateRouteSummary(route)

  // Attach calculations to the JSON export so it is present in Route exports
  const routeWithSummary = {
    ...route,
    calculated_summary: summary
  }

  const json = JSON.stringify(routeWithSummary, null, 2)

  // Generate a clean Loading Sheet format for text exports
  const plainTextSummary = [
    `LOADING SHEET: ${route.route_name}`,
    `Date: ${route.route_date}`,
    `==========================================`,
    ``,
    `PRODUCTS:`,
    ...summary.products.map(
      (p) => `- ${p.productName}: ${p.orderedQuantity} Bottles (${p.fullCrates} Crates, ${p.looseBottles} Loose)`
    ),
    ``,
    `FREE ITEMS:`,
    `- Free Water: ${summary.totals.freeWaterBottles} Bottles (${summary.totals.freeWaterCrates} Crates, ${summary.totals.freeWaterLoose} Loose Bottles)`,
    `- Free 250ml: ${summary.totals.free250mlBottles} Bottles (${summary.totals.free250mlCrates} Crates, ${summary.totals.free250mlLoose} Loose Bottles)`
  ].join('\n')

  return (
    <>
      <PageHeader title="Export route" subtitle={route.route_name} backHref={`/routes/${route.id}`} />
      <section className="p-4 space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>Loading Sheet Summary (Plain Text)</CardTitle>
          </CardHeader>
          <CardContent>
            <Textarea readOnly value={plainTextSummary} className="min-h-[250px] font-mono text-xs" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Single route JSON backup (includes calculations)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="mb-3">
              <ShareRouteExport routeName={route.route_name} json={json} />
            </div>
            <Textarea readOnly value={json} className="min-h-[350px] font-mono text-xs" />
          </CardContent>
        </Card>
      </section>
    </>
  )
}
