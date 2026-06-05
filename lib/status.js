export const routeStatuses = ['Draft', 'Ready To Load', 'Dispatched', 'Dropped']

export function statusBadgeVariant(status) {
  if (status === 'Ready To Load') return 'success'
  if (status === 'Dispatched') return 'secondary'
  if (status === 'Dropped') return 'destructive'
  return 'warning'
}

export function isActiveLoadingStatus(status) {
  return status !== 'Dispatched' && status !== 'Dropped'
}
