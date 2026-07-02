import { PageHeader } from '@/components/layout/page-header'
import { InventoryReports } from '@/components/inventory/inventory-reports'
import { getInventoryReports } from '@/lib/supabase/inventory-queries'

export const metadata = {
  title: 'Inventory Reports | Warehouse Stock',
  description: 'View current stock summary, stock entry history, and damage history reports.'
}

export default async function InventoryReportsPage() {
  const { currentStock, stockEntries, damages } = await getInventoryReports()

  return (
    <>
      <PageHeader
        title="Inventory Reports"
        subtitle="Current stock, entries, and damage history"
        backHref="/warehouse-stock"
      />
      <section className="p-4">
        <InventoryReports
          currentStock={currentStock}
          stockEntries={stockEntries}
          damages={damages}
        />
      </section>
    </>
  )
}
