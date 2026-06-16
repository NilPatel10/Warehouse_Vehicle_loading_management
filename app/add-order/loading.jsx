import { Skeleton } from '@/components/ui/skeleton'

export default function AddOrderLoading() {
  return (
    <>
      {/* Page header skeleton */}
      <div className="flex flex-col gap-1 p-4 pb-0">
        <Skeleton className="h-7 w-32" />
        <Skeleton className="h-4 w-52 mt-1" />
      </div>

      <section className="space-y-4 p-4">
        {/* Card skeleton */}
        <div className="rounded-lg border bg-card p-5 space-y-4">
          <Skeleton className="h-5 w-28" />
          <Skeleton className="h-4 w-60" />
          <div className="space-y-3">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-11 w-full" />
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-11 w-full" />
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-11 w-full" />
          </div>
        </div>
      </section>
    </>
  )
}
