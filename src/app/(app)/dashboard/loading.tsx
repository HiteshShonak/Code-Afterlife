export default function DashboardLoading() {
  return (
    <div className="mx-auto max-w-6xl px-6 pb-24 pt-24 md:px-10">
      {/* Top bar skeleton */}
      <div className="mb-12 flex items-end justify-between">
        <div className="flex flex-col gap-3">
          <div className="h-3 w-24 animate-pulse rounded-sm bg-foreground/8" />
          <div className="h-7 w-40 animate-pulse rounded-sm bg-foreground/8" />
          <div className="mt-2 flex gap-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex flex-col gap-1">
                <div className="h-6 w-8 animate-pulse rounded-sm bg-foreground/8" />
                <div className="h-2.5 w-12 animate-pulse rounded-sm bg-foreground/6" />
              </div>
            ))}
          </div>
        </div>
        <div className="h-8 w-28 animate-pulse rounded-sm bg-foreground/8" />
      </div>

      {/* Card grid skeleton */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            className="flex flex-col gap-4 rounded-sm border border-foreground/8 bg-card/60 p-5"
            style={{ animationDelay: `${i * 60}ms` }}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="h-4 w-3/4 animate-pulse rounded-sm bg-foreground/8" />
              <div className="h-4 w-14 animate-pulse rounded-sm bg-foreground/8" />
            </div>
            <div className="h-8 w-full animate-pulse rounded-sm bg-foreground/6" />
            <div className="flex flex-col gap-1.5">
              <div className="h-2.5 w-full animate-pulse rounded-full bg-foreground/8" />
              <div className="h-2.5 w-16 animate-pulse rounded-sm bg-foreground/6" />
            </div>
            <div className="flex gap-1.5">
              {[1, 2, 3].map((j) => (
                <div key={j} className="h-5 w-14 animate-pulse rounded-sm bg-foreground/6" />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
