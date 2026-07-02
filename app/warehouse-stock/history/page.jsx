import { PageHeader } from '@/components/layout/page-header'
import { InventoryHistoryList } from '@/components/inventory/inventory-history-list'
import { getInventoryHistory } from '@/lib/supabase/inventory-queries'

export const metadata = {
  title: 'Inventory History | Warehouse Stock',
  description: 'View all stock entry and damage transaction history. Immutable audit trail.'
}

export default async function InventoryHistoryPage() {
  const transactions = await getInventoryHistory()

  return (
    <>
      <PageHeader
        title="Inventory History"
        subtitle="All stock entries and damage records — read-only"
        backHref="/warehouse-stock"
      />
      <section className="p-4">
        <InventoryHistoryList transactions={transactions} />
      </section>
    </>
  )
}
