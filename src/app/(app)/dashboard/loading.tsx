export default function DashboardLoading() {
  return (
    <div className="mx-auto max-w-350 px-6 pb-24 pt-12 md:px-10 animate-pulse">
      {/* Welcome strip */}
      <div className="mb-10 flex flex-col justify-between gap-6 md:flex-row md:items-start">
        <div>
          <div className="h-3 w-40 bg-muted-foreground/20 rounded-sm mb-3" />
          <div className="h-8 w-80 bg-foreground/10 rounded-sm mb-3" />
          <div className="h-3 w-64 max-w-full bg-muted-foreground/10 rounded-sm" />
        </div>

        {/* Stats + Sort row */}
        <div className="flex flex-col items-end gap-3">
          <div className="flex gap-1.5 rounded-xl border border-border/60 bg-card/60 p-1.5">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex flex-col items-center justify-center rounded-lg px-3.5 py-2 w-16">
                <div className="h-2 w-8 bg-muted-foreground/20 rounded-sm mb-1.5" />
                <div className="h-5 w-6 bg-foreground/10 rounded-sm" />
              </div>
            ))}
          </div>
          <div className="flex items-center gap-2">
            <div className="h-2 w-8 bg-muted-foreground/20 rounded-sm" />
            <div className="h-8 w-32 rounded-lg border border-border/60 bg-card/60" />
          </div>
        </div>
      </div>

      {/* Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <div
            key={i}
            className="flex flex-col gap-4 rounded-xl border border-foreground/8 bg-card/60 p-5 h-95"
          />
        ))}
      </div>
    </div>
  );
}
