import { EnvWarning } from '@/components/env-warning'
import { PageHeader } from '@/components/layout/page-header'
import { SettingsForms } from '@/components/settings/settings-forms'
import { getSettingsData } from '@/lib/supabase/queries'

export default async function SettingsPage() {
  const { envMissing, categories, products, users, appSettings } = await getSettingsData()

  return (
    <>
      <PageHeader title="Settings" subtitle="Products, schemes, users, backup, and app config" />
      {envMissing ? <EnvWarning /> : null}
      <section className="p-4">
        <SettingsForms categories={categories} products={products} users={users} appSettings={appSettings} />
      </section>
    </>
  )
}
