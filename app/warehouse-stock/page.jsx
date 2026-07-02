import { PageHeader } from '@/components/layout/page-header'
import { InventoryDashboard } from '@/components/inventory/inventory-dashboard'
import { getInventoryDashboardData, getInventoryProductsAndCategories } from '@/lib/supabase/inventory-queries'

export const metadata = {
  title: 'Warehouse Stock | Dashboard',
  description: 'View current inventory levels, recent stock entries and damage records.'
}

export default async function WarehouseStockPage() {
  const [dashData, { products }] = await Promise.all([
    getInventoryDashboardData(),
    getInventoryProductsAndCategories()
  ])

  return (
    <>
      <PageHeader
        title="Warehouse Stock"
        subtitle="Live inventory overview"
        backHref="/"
      />
      <section className="p-4 space-y-4">
        <InventoryDashboard data={dashData} products={products} />
      </section>
    </>
  )
}
