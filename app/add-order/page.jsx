import { createRoute } from '@/app/actions'
import { EnvWarning } from '@/components/env-warning'
import { PageHeader } from '@/components/layout/page-header'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
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
            <form action={createRoute} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="route_name">Route name</Label>
                <Input id="route_name" name="route_name" placeholder="Morning loading - Surat" required disabled={!user} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="route_date">Route date</Label>
                <Input id="route_date" name="route_date" type="date" defaultValue={todayISO()} required disabled={!user} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="notes">Route notes</Label>
                <Textarea id="notes" name="notes" placeholder="Vehicle, driver, lane, or warehouse notes" disabled={!user} />
              </div>
              <Button className="w-full" disabled={!user}>Create route</Button>
            </form>
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
