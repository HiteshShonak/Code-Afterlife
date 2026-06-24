export default function UserProfileLoading() {
  return (
    <div className="min-h-screen bg-background animate-pulse">
      <main className="relative mx-auto max-w-5xl px-6 py-16 md:px-10 lg:py-24">
        {/* HERO HEADER */}
        <div className="mb-16">
          <div className="flex flex-col items-center gap-8 text-center md:flex-row md:text-left md:items-start">
            <div className="relative shrink-0 h-28 w-28 rounded-full border-2 border-border/20 bg-muted/20" />
            
            <div className="flex-1 min-w-0 w-full flex flex-col items-center md:items-start">
              <div className="h-10 md:h-12 w-64 bg-foreground/10 rounded-xl" />
              <div className="mt-3 h-3 w-40 bg-muted-foreground/10 rounded-sm" />
              <div className="mt-5 h-8 w-48 bg-foreground/5 rounded-full border border-border/10" />
            </div>
          </div>

          {/* Stat Row */}
          <div className="mt-10 grid grid-cols-2 gap-4 sm:grid-cols-4 lg:grid-cols-5">
            <div className="col-span-2 sm:col-span-1 h-36 rounded-2xl border border-border/20 bg-card/20" />
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-36 rounded-2xl border border-border/20 bg-card/20" />
            ))}
          </div>
        </div>

        {/* TABS */}
        <div className="mb-8 flex border-b border-border/20">
          <div className="h-12 w-32 px-6 py-4">
            <div className="h-4 w-full bg-foreground/10 rounded-sm" />
          </div>
          <div className="h-12 w-32 px-6 py-4">
            <div className="h-4 w-full bg-muted-foreground/10 rounded-sm" />
          </div>
          <div className="h-12 w-32 px-6 py-4">
            <div className="h-4 w-full bg-muted-foreground/10 rounded-sm" />
          </div>
        </div>

        {/* PROJECT GRID */}
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-95 rounded-xl border border-border/20 bg-card/20" />
          ))}
        </div>
      </main>
    </div>
  );
}
