'use client'

import { useState } from 'react'
import { deleteRoute, updateRouteStatus } from '@/app/actions'
import { Button } from '@/components/ui/button'
import { routeStatuses } from '@/lib/status'
import { useFormAction } from '@/lib/hooks/use-form-action'

const STATUS_DESCRIPTIONS = {
  Draft: {
    icon: '📝',
    label: 'Draft',
    description: 'Route is being planned. Products and shop orders can be added or edited. Vehicle has not been loaded yet.',
    color: 'text-yellow-800 dark:text-yellow-300 bg-yellow-50 dark:bg-yellow-950/40 border-yellow-200 dark:border-yellow-800'
  },
  'Ready To Load': {
    icon: '✅',
    label: 'Ready To Load',
    description: 'Planning is complete. The loading summary is final and the vehicle can be loaded. No further order changes should be made.',
    color: 'text-green-800 dark:text-green-300 bg-green-50 dark:bg-green-950/40 border-green-200 dark:border-green-800'
  },
  Dispatched: {
    icon: '🚛',
    label: 'Dispatched',
    description: 'Vehicle has left the warehouse and is on route delivering to shops. Route is now read-only.',
    color: 'text-blue-800 dark:text-blue-300 bg-blue-50 dark:bg-blue-950/40 border-blue-200 dark:border-blue-800'
  },
  Dropped: {
    icon: '❌',
    label: 'Dropped',
    description: 'Route was cancelled or abandoned before or during delivery. Use this status to mark routes that did not complete.',
    color: 'text-red-800 dark:text-red-300 bg-red-50 dark:bg-red-950/40 border-red-200 dark:border-red-800'
  }
}

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

  const currentStatusInfo = STATUS_DESCRIPTIONS[route.status]

  return (
    <div className="space-y-3">
      {/* Current status description */}
      {currentStatusInfo && (
        <div className={`rounded-md border px-3 py-2 text-xs ${currentStatusInfo.color}`}>
          <p className="font-semibold">{currentStatusInfo.icon} Current Status: {currentStatusInfo.label}</p>
          <p className="mt-0.5">{currentStatusInfo.description}</p>
        </div>
      )}

      {/* Status button grid */}
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

      {/* Status reference guide */}
      <div className="rounded-md border bg-muted/40 p-3 space-y-2">
        <p className="text-xs font-semibold text-muted-foreground">Status Guide</p>
        {routeStatuses.map((status) => {
          const info = STATUS_DESCRIPTIONS[status]
          return (
            <div key={status} className="text-xs text-muted-foreground">
              <span className="font-medium text-foreground">{info.icon} {info.label}:</span> {info.description}
            </div>
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
