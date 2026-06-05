import { updateRouteStatus } from '@/app/actions'
import { Button } from '@/components/ui/button'
import { routeStatuses } from '@/lib/status'

export function StatusActions({ route, disabled = false }) {
  return (
    <div className="grid grid-cols-2 gap-2">
      {routeStatuses.map((status) => (
        <form key={status} action={updateRouteStatus}>
          <input type="hidden" name="route_id" value={route.id} />
          <input type="hidden" name="status" value={status} />
          <Button className="w-full" variant={route.status === status ? 'default' : 'outline'} disabled={disabled}>
            {status}
          </Button>
        </form>
      ))}
    </div>
  )
}
