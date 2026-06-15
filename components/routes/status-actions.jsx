'use client'

import { useState } from 'react'
import { deleteRoute, updateRouteStatus } from '@/app/actions'
import { Button } from '@/components/ui/button'
import { routeStatuses } from '@/lib/status'
import { useFormAction } from '@/lib/hooks/use-form-action'

export function StatusActions({ route, disabled = false }) {
  const [activeStatus, setActiveStatus] = useState(null)
  const [handleStatusUpdate, isPending] = useFormAction(updateRouteStatus, {
    loadingMessage: 'Updating status...',
    successMessage: 'Route status updated!',
    onSuccess: () => setActiveStatus(null)
  })

  const [handleRouteDelete, deletePending] = useFormAction(deleteRoute, {
    loadingMessage: 'Deleting route...',
    successMessage: 'Route deleted successfully!'
  })

  const handleStatusChange = async (status) => {
    setActiveStatus(status)
    const formData = new FormData()
    formData.append('route_id', route.id)
    formData.append('status', status)
    
    try {
      await handleStatusUpdate(formData)
    } finally {
      setActiveStatus(null)
    }
  }

  const onDeleteRoute = () => {
    if (!confirm(`Are you sure you want to delete route "${route.route_name}"? This will permanently delete all shop orders in this route.`)) return
    const formData = new FormData()
    formData.append('route_id', route.id)
    handleRouteDelete(formData)
  }

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-2">
        {routeStatuses.map((status) => {
          const isCurrent = route.status === status
          const isBtnLoading = isPending && activeStatus === status
          
          return (
            <Button
              key={status}
              type="button"
              variant={isCurrent ? 'default' : 'outline'}
              disabled={disabled || isPending || deletePending}
              loading={isBtnLoading}
              onClick={() => handleStatusChange(status)}
              className="w-full"
            >
              {status}
            </Button>
          )
        })}
      </div>
      <Button
        type="button"
        variant="destructive"
        disabled={disabled || isPending || deletePending}
        loading={deletePending}
        onClick={onDeleteRoute}
        className="w-full"
      >
        Delete Route
      </Button>
    </div>
  )
}
