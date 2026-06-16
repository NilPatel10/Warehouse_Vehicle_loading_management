import { Skeleton } from '@/components/ui/skeleton'

export default function OrdersLoading() {
  return (
    <>
      {/* Page header skeleton */}
      <div className="flex flex-col gap-1 p-4 pb-0">
        <Skeleton className="h-7 w-36" />
        <Skeleton className="h-4 w-48 mt-1" />
      </div>

      <section className="p-4 space-y-3">
        {/* Search input skeleton */}
        <Skeleton className="h-11 w-full" />

        {/* Accordion sections skeleton */}
        {['Draft routes', 'Ready to Load routes', 'Overdue routes'].map((label) => (
          <div key={label} className="rounded-lg border bg-card px-3 py-4 space-y-3">
            <div className="flex items-center justify-between">
              <Skeleton className="h-5 w-32" />
              <Skeleton className="h-5 w-8 rounded-full" />
            </div>
            {/* Route card skeletons */}
            {[1, 2].map((i) => (
              <div key={i} className="rounded-lg border bg-card p-3 space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-1 flex-1">
                    <Skeleton className="h-5 w-3/4" />
                    <Skeleton className="h-4 w-1/3" />
                  </div>
                  <Skeleton className="h-6 w-20 rounded-full" />
                </div>
                <div className="grid grid-cols-3 gap-2">
                  {[1, 2, 3].map((j) => (
                    <Skeleton key={j} className="h-14 rounded-md" />
                  ))}
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <Skeleton className="h-11 rounded-md" />
                  <Skeleton className="h-11 rounded-md" />
                </div>
              </div>
            ))}
          </div>
        ))}
      </section>
    </>
  )
}
