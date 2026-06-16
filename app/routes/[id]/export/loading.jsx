import { Skeleton } from '@/components/ui/skeleton'

export default function RouteExportLoading() {
  return (
    <>
      {/* Page header skeleton */}
      <div className="flex items-center gap-3 p-4 pb-0">
        <Skeleton className="h-9 w-9 rounded-md" />
        <div className="space-y-1 flex-1">
          <Skeleton className="h-6 w-32" />
          <Skeleton className="h-4 w-48" />
        </div>
      </div>

      <section className="p-4">
        <div className="rounded-lg border bg-card p-5 space-y-4">
          <Skeleton className="h-5 w-48" />
          <Skeleton className="h-11 w-full rounded-md" />
          <Skeleton className="h-[60vh] w-full rounded-md" />
        </div>
      </section>
    </>
  )
}
