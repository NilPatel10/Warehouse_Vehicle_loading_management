import { PageHeader } from '@/components/layout/page-header'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { DamageEntryForm } from '@/components/inventory/damage-entry-form'
import { requireServerSupabase } from '@/lib/supabase/queries'
import { getDamageReasons, getInventoryProductsAndCategories } from '@/lib/supabase/inventory-queries'

export const metadata = {
  title: 'Damage Entry | Warehouse Stock',
  description: 'Record damaged or lost stock. Quantities in bottles. Stock cannot go negative.'
}

export default async function DamageEntryPage() {
  const [{ products }, damageReasons, { supabase }] = await Promise.all([
    getInventoryProductsAndCategories(),
    getDamageReasons(),
    requireServerSupabase()
  ])

  const activeProducts = products.filter(p => p.is_active)

  // Fetch current stock for all products (for validation display)
  const { data: currentStock } = supabase
    ? await supabase.from('inventory_stock').select('product_id, current_stock_bottles')
    : { data: [] }

  return (
    <>
      <PageHeader
        title="Damage Entry"
        subtitle="Record warehouse losses in bottles"
        backHref="/warehouse-stock"
      />
      <section className="p-4">
        <Card>
          <CardHeader>
            <CardTitle>New Damage Entry</CardTitle>
            <CardDescription>
              Select a reason and enter damaged quantity per product in bottles. Negative stock is not allowed.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <DamageEntryForm
              products={activeProducts}
              damageReasons={damageReasons}
              currentStock={currentStock || []}
            />
          </CardContent>
        </Card>
      </section>
    </>
  )
}
