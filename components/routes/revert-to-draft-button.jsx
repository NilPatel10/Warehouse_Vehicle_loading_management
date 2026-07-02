'use client'

import { updateRouteStatus } from '@/app/actions'
import { Button } from '@/components/ui/button'
import { useFormAction } from '@/lib/hooks/use-form-action'

export function RevertToDraftButton({ routeId }) {
  const [handleStatusUpdate, isPending] = useFormAction(updateRouteStatus, {
    loadingMessage: 'Reverting status to Draft...',
    successMessage: 'Route status reverted to Draft'
  })

  const handleClick = (event) => {
    event.preventDefault()
    const formData = new FormData()
    formData.append('route_id', routeId)
    formData.append('status', 'Draft')
    handleStatusUpdate(formData)
  }

  return (
    <Button
      type="button"
      variant="outline"
      onClick={handleClick}
      loading={isPending}
      disabled={isPending}
      className="border-yellow-300 hover:bg-yellow-100 text-yellow-900 bg-white dark:bg-zinc-950 dark:hover:bg-zinc-900 dark:text-yellow-200"
    >
      Change Status to Draft
    </Button>
  )
}
