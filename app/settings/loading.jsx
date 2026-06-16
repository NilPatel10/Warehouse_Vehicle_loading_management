import { Skeleton } from '@/components/ui/skeleton'

export default function SettingsLoading() {
  return (
    <>
      {/* Page header skeleton */}
      <div className="flex flex-col gap-1 p-4 pb-0">
        <Skeleton className="h-7 w-24" />
        <Skeleton className="h-4 w-64 mt-1" />
      </div>

      <section className="p-4 space-y-3">
        {/* Accordion items skeleton */}
        {[
          'Bottle Categories CRUD',
          'Products/Brands CRUD',
          'Scheme Configuration',
          'Users',
          'Route Export / Backup',
          'App Settings'
        ].map((label) => (
          <div key={label} className="rounded-lg border bg-card px-3 py-4">
            <div className="flex items-center justify-between">
              <Skeleton className="h-5 w-48" />
              <Skeleton className="h-5 w-8 rounded-full" />
            </div>
          </div>
        ))}
      </section>
    </>
  )
}
