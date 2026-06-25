import { GitFork, ShieldAlert } from 'lucide-react';

export default function ResurrectSetupLoading() {
  return (
    <div className="mx-auto min-h-[calc(100vh-4rem)] max-w-4xl px-6 py-16 md:px-10">
      <div className="mb-12 animate-pulse">
        <div className="mb-2 h-3 w-44 rounded-sm bg-muted-foreground/15" />
        <div className="h-9 w-full max-w-md rounded-sm bg-foreground/10" />
        <div className="mt-3 h-4 w-full max-w-xl rounded-sm bg-muted-foreground/10" />
      </div>

      <div className="mb-8 flex animate-pulse items-center gap-2">
        {[0, 1, 2].map((item) => (
          <div key={item} className="flex flex-1 items-center gap-2">
            <div className="h-8 w-8 rounded-full border border-border bg-card/40" />
            <div className="hidden h-3 w-24 rounded-sm bg-muted-foreground/10 sm:block" />
            {item < 2 && <div className="h-px flex-1 bg-border/60" />}
          </div>
        ))}
      </div>

      <div className="grid animate-pulse gap-6 md:grid-cols-2">
        <div className="rounded-2xl border border-emerald-500/15 bg-card/30 p-6">
          <div className="mb-6 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full border border-emerald-500/15 bg-emerald-500/5 text-emerald-400/20">
              <GitFork className="h-5 w-5" />
            </div>
            <div>
              <div className="h-4 w-36 rounded-sm bg-foreground/10" />
              <div className="mt-2 h-3 w-28 rounded-sm bg-muted-foreground/10" />
            </div>
          </div>
          <div className="space-y-3">
            <div className="h-3 w-full rounded-sm bg-muted-foreground/10" />
            <div className="h-3 w-4/5 rounded-sm bg-muted-foreground/10" />
          </div>
          <div className="mt-10 h-12 rounded-sm border border-emerald-500/15 bg-emerald-500/5" />
        </div>

        <div className="rounded-2xl border border-border/50 bg-card/30 p-6">
          <div className="mb-6 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full border border-amber-500/15 bg-amber-500/5 text-amber-400/20">
              <ShieldAlert className="h-5 w-5" />
            </div>
            <div>
              <div className="h-4 w-32 rounded-sm bg-foreground/10" />
              <div className="mt-2 h-3 w-24 rounded-sm bg-muted-foreground/10" />
            </div>
          </div>
          <div className="space-y-4">
            <div className="h-10 rounded-lg border border-border bg-background/40" />
            <div className="h-24 rounded-lg border border-border bg-background/40" />
          </div>
        </div>
      </div>
    </div>
  );
}
