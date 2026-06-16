import { Skeleton } from '@/components/ui/skeleton'

export default function RouteEditLoading() {
  return (
    <>
      {/* Page header skeleton */}
      <div className="flex items-center gap-3 p-4 pb-0">
        <Skeleton className="h-9 w-9 rounded-md" />
        <div className="space-y-1 flex-1">
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-24" />
        </div>
        <Skeleton className="h-6 w-20 rounded-full" />
      </div>

      <section className="space-y-4 p-4">
        {/* Lock status placeholder */}
        <Skeleton className="h-10 w-40 rounded-md" />

        {/* Add shop order form card */}
        <div className="rounded-lg border bg-card p-5 space-y-4">
          <Skeleton className="h-5 w-36" />
          <div className="space-y-3">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-11 w-full" />
            <Skeleton className="h-4 w-24" />
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-11 w-full" />
            ))}
            <Skeleton className="h-4 w-36" />
            <Skeleton className="h-11 w-full" />
            <Skeleton className="h-11 w-full" />
          </div>
        </div>

        {/* Status card */}
        <div className="rounded-lg border bg-card p-5 space-y-3">
          <Skeleton className="h-5 w-16" />
          <div className="grid grid-cols-2 gap-2">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-11 rounded-md" />
            ))}
          </div>
          <Skeleton className="h-11 w-full rounded-md" />
        </div>

        {/* Loading summary card */}
        <div className="rounded-lg border bg-card p-5 space-y-4">
          <Skeleton className="h-5 w-36" />
          <div className="grid grid-cols-3 gap-3">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-20 rounded-md" />
            ))}
          </div>
        </div>

        {/* Shop orders */}
        {[1, 2].map((i) => (
          <div key={i} className="rounded-lg border bg-card p-3 space-y-3">
            <div className="flex items-start justify-between gap-3">
              <div className="space-y-1">
                <Skeleton className="h-5 w-36" />
                <Skeleton className="h-3 w-40" />
              </div>
              <Skeleton className="h-6 w-20 rounded-full" />
            </div>
            {[1, 2].map((j) => (
              <Skeleton key={j} className="h-16 rounded-md" />
            ))}
            <div className="grid grid-cols-2 gap-2">
              <Skeleton className="h-12 rounded-md" />
              <Skeleton className="h-12 rounded-md" />
            </div>
          </div>
        ))}
      </section>
    </>
  )
}
