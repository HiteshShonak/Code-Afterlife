export default function ProjectLoading() {
  return (
    <div className="min-h-screen bg-background animate-pulse">
      {/* Back nav */}
      <div className="mx-auto max-w-4xl px-6 pt-8 md:px-10">
        <div className="mb-8 flex items-center gap-4">
          <div className="flex items-center gap-1.5 h-4 w-20 bg-muted-foreground/10 rounded-sm" />
          <span className="font-mono text-xs text-muted-foreground/30">/</span>
          <div className="h-4 w-32 bg-muted-foreground/10 rounded-sm" />
        </div>
      </div>

      <main className="mx-auto max-w-4xl px-6 pb-32 md:px-10">
        {/* Hero Header */}
        <div className="mb-10">
          <div className="h-4 w-32 bg-muted-foreground/20 rounded-sm mb-4" />
          
          <div className="flex items-start justify-between gap-4">
            <div className="h-12 w-3/4 max-w-lg bg-foreground/10 rounded-xl" />
            <div className="h-6 w-20 bg-foreground/5 rounded-full mt-2" />
          </div>

          <div className="mt-6 space-y-2">
            <div className="h-5 w-full max-w-3xl bg-muted-foreground/10 rounded-md" />
            <div className="h-5 w-[80%] max-w-2xl bg-muted-foreground/10 rounded-md" />
          </div>

          {/* Meta row */}
          <div className="mt-5 flex gap-5">
            <div className="h-4 w-32 bg-muted-foreground/10 rounded-sm" />
            <div className="h-4 w-32 bg-muted-foreground/10 rounded-sm" />
            <div className="h-4 w-32 bg-muted-foreground/10 rounded-sm" />
          </div>

          {/* Social action bar */}
          <div className="mt-6 flex flex-wrap items-center gap-3">
            <div className="h-10 w-16 rounded-xl bg-card/60 border border-border/60" />
            <div className="h-10 w-16 rounded-xl bg-card/60 border border-border/60" />
            <div className="h-10 w-16 rounded-xl bg-card/60 border border-border/60" />
            <div className="h-10 w-16 rounded-xl bg-card/60 border border-border/60" />
            <div className="ml-auto h-10 w-32 rounded-xl bg-accent/5 border border-accent/20" />
          </div>
        </div>

        {/* Health */}
        <div className="mb-8 h-32 rounded-2xl border border-foreground/8 bg-card/60 p-6" />

        {/* Community Prediction */}
        <div className="mb-8 h-40 rounded-2xl border border-foreground/8 bg-card/60 p-6" />

        {/* Stack */}
        <div className="mb-8 h-20 rounded-xl bg-transparent" />

        {/* Timeline */}
        <div className="mb-8">
          <div className="mb-5 flex items-center justify-between">
            <div className="h-4 w-24 bg-muted-foreground/10 rounded-sm" />
            <div className="h-6 w-24 bg-accent/5 rounded-full border border-accent/20" />
          </div>
          <div className="space-y-4">
            <div className="h-24 w-full bg-card/40 rounded-xl" />
            <div className="h-24 w-full bg-card/40 rounded-xl" />
          </div>
        </div>
      </main>
    </div>
  );
}
