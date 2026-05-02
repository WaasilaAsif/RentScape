type DashboardSkeletonProps = {
  cards?: number
  showTopbar?: boolean
  layout?: 'grid' | 'list'
}

export function DashboardSkeleton({
  cards = 6,
  showTopbar = true,
  layout = 'grid',
}: DashboardSkeletonProps) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 py-8">
      <div className="mx-auto max-w-7xl space-y-8 px-4 sm:px-6 lg:px-8">

        {showTopbar && (
          <div className="space-y-2">
            <div className="h-7 w-48 animate-pulse rounded-lg bg-blue-100" />
            <div className="h-4 w-64 animate-pulse rounded-lg bg-blue-50" />
          </div>
        )}

        <div className="h-10 w-full animate-pulse rounded-xl bg-white/60" />

        <div className={
          layout === 'grid'
            ? 'grid gap-4 md:grid-cols-2 xl:grid-cols-3'
            : 'flex flex-col gap-4'
        }>
          {Array.from({ length: cards }).map((_, i) => (
            <div
              key={i}
              className="rounded-2xl border border-blue-100 bg-white p-6 space-y-3"
            >
              <div className="h-5 w-3/4 animate-pulse rounded-lg bg-slate-100" />
              <div className="h-4 w-1/2 animate-pulse rounded-lg bg-slate-100" />
              <div className="h-4 w-1/3 animate-pulse rounded-lg bg-slate-100" />
              <div className="h-6 w-16 animate-pulse rounded-full bg-slate-100" />
            </div>
          ))}
        </div>

      </div>
    </div>
  )
}
