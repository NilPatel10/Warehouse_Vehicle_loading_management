import { EnvWarning } from '@/components/env-warning'
import { PageHeader } from '@/components/layout/page-header'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { CreateRouteForm } from '@/components/routes/create-route-form'
import { requireServerSupabase } from '@/lib/supabase/queries'
import { todayISO } from '@/lib/utils'

export default async function AddOrderPage() {
  const { user, envMissing } = await requireServerSupabase()

  return (
    <>
      <PageHeader title="Add Order" subtitle="Create a route, then add shop orders" />
      {envMissing ? <EnvWarning /> : null}
      <section className="space-y-4 p-4">
        <Card>
          <CardHeader>
            <CardTitle>New route</CardTitle>
            <CardDescription>Routes start as Draft and can be locked when opened for editing.</CardDescription>
          </CardHeader>
          <CardContent>
            <CreateRouteForm user={user} defaultDate={todayISO()} />
          </CardContent>
        </Card>
        {!user && !envMissing ? (
          <Card>
            <CardContent className="p-4 text-sm text-muted-foreground">
              Sign in from the login page before creating shared warehouse routes.
            </CardContent>
          </Card>
        ) : null}
      </section>
    </>
  )
}
