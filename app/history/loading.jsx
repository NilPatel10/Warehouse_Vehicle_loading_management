import { Skeleton } from '@/components/ui/skeleton'

export default function HistoryLoading() {
  return (
    <>
      {/* Page header skeleton */}
      <div className="flex flex-col gap-1 p-4 pb-0">
        <Skeleton className="h-7 w-24" />
        <Skeleton className="h-4 w-52 mt-1" />
      </div>

      <section className="space-y-3 p-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="rounded-lg border bg-card p-4 space-y-3">
            {/* Title + badge row */}
            <div className="flex items-start justify-between gap-3">
              <div className="space-y-1 flex-1 min-w-0">
                <Skeleton className="h-5 w-3/4" />
                <Skeleton className="h-4 w-1/3" />
                <Skeleton className="h-3 w-2/3 mt-1" />
              </div>
              <Skeleton className="h-6 w-20 rounded-full flex-shrink-0" />
            </div>
            {/* Stats grid */}
            <div className="grid grid-cols-3 gap-2">
              {[1, 2, 3].map((j) => (
                <Skeleton key={j} className="h-14 rounded-md" />
              ))}
            </div>
            {/* View details button */}
            <Skeleton className="h-11 w-full rounded-md" />
          </div>
        ))}
      </section>
    </>
  )
}
