import { PageHeader } from '@/components/layout/page-header'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { StockEntryForm } from '@/components/inventory/stock-entry-form'
import { getInventoryProductsAndCategories } from '@/lib/supabase/inventory-queries'

export const metadata = {
  title: 'Stock Entry | Warehouse Stock',
  description: 'Receive new stock into the warehouse. Enter full crates per product.'
}

export default async function StockEntryPage() {
  const { products } = await getInventoryProductsAndCategories()
  const activeProducts = products.filter(p => p.is_active)

  return (
    <>
      <PageHeader
        title="Stock Entry"
        subtitle="Record new stock received in full crates"
        backHref="/warehouse-stock"
      />
      <section className="p-4">
        <Card>
          <CardHeader>
            <CardTitle>New Stock Entry</CardTitle>
            <CardDescription>
              Enter the number of full crates received per product. Bottles are calculated automatically.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <StockEntryForm products={activeProducts} />
          </CardContent>
        </Card>
      </section>
    </>
  )
}
