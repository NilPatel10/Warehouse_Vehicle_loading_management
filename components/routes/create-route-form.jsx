'use client'

import { createRoute } from '@/app/actions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { useFormAction } from '@/lib/hooks/use-form-action'

export function CreateRouteForm({ user, defaultDate }) {
  const [handleCreateRoute, isPending] = useFormAction(createRoute, {
    loadingMessage: 'Creating route...',
    successMessage: 'Route Created'
  })

  return (
    <form onSubmit={handleCreateRoute} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="route_name">Route name</Label>
        <Input
          id="route_name"
          name="route_name"
          placeholder="Morning loading - Surat"
          required
          disabled={!user || isPending}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="route_date">Route date</Label>
        <Input
          id="route_date"
          name="route_date"
          type="date"
          defaultValue={defaultDate}
          required
          disabled={!user || isPending}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="notes">Route notes</Label>
        <Textarea
          id="notes"
          name="notes"
          placeholder="Vehicle, driver, lane, or warehouse notes"
          disabled={!user || isPending}
        />
      </div>
      <Button type="submit" className="w-full" loading={isPending} loadingText="Creating" disabled={!user}>
        Create route
      </Button>
    </form>
  )
}
