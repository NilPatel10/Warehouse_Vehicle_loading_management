import { EnvWarning } from '@/components/env-warning'
import { PageHeader } from '@/components/layout/page-header'
import { InventorySettingsForms } from '@/components/inventory/inventory-settings-forms'
import { getInventoryProductsAndCategories, getDamageReasons } from '@/lib/supabase/inventory-queries'
import { requireServerSupabase } from '@/lib/supabase/queries'

export const metadata = {
  title: 'Stock Settings | Warehouse Stock',
  description: 'Manage independent Inventory product masters, category configurations, damage reasons, and prefixes.'
}

export default async function StockSettingsPage() {
  const { products, categories, envMissing: inventoryEnvMissing } = await getInventoryProductsAndCategories()
  const damageReasons = await getDamageReasons()
  const { supabase, envMissing } = await requireServerSupabase()

  let appSettings = []
  if (supabase) {
    const { data } = await supabase.from('app_settings').select('*')
    appSettings = data || []
  }

  return (
    <>
      <PageHeader
        title="Stock Settings"
        subtitle="Manage independent stock masters"
        backHref="/warehouse-stock"
      />
      {envMissing || inventoryEnvMissing ? <EnvWarning /> : null}
      <section className="p-4">
        <InventorySettingsForms
          categories={categories}
          products={products}
          damageReasons={damageReasons}
          appSettings={appSettings}
        />
      </section>
    </>
  )
}
