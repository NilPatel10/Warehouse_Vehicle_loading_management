import { Skeleton } from '@/components/ui/skeleton'

export default function SettingsLoading() {
  return (
    <>
      {/* Page header skeleton */}
      <div className="flex flex-col gap-1 p-4 pb-0">
        <Skeleton className="h-7 w-24" />
        <Skeleton className="h-4 w-64 mt-1" />
      </div>

      <section className="p-4 space-y-4">
        {/* Expanded Bottle Categories CRUD Form skeleton */}
        <div className="rounded-lg border bg-card p-4 space-y-4">
          <div className="flex items-center justify-between border-b pb-2">
            <Skeleton className="h-5 w-48" />
            <Skeleton className="h-5 w-8 rounded-full" />
          </div>
          {/* Skeleton Form Fields */}
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-10 w-full" />
            </div>
            <div className="space-y-2">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-10 w-full" />
            </div>
            <div className="space-y-2">
              <Skeleton className="h-4 w-40" />
              <Skeleton className="h-10 w-full" />
            </div>
            <div className="space-y-2">
              <Skeleton className="h-4 w-28" />
              <Skeleton className="h-10 w-full" />
            </div>
          </div>
          <Skeleton className="h-11 w-full rounded-md" />
        </div>

        {/* Collapsed items skeletons */}
        {[
          'Products/Brands CRUD',
          'Scheme Configuration',
          'Users',
          'Route Export / Backup',
          'App Settings'
        ].map((label) => (
          <div key={label} className="rounded-lg border bg-card px-3 py-4">
            <div className="flex items-center justify-between">
              <Skeleton className="h-5 w-40" />
              <Skeleton className="h-5 w-8 rounded-full" />
            </div>
          </div>
        ))}
      </section>
    </>
  )
}
