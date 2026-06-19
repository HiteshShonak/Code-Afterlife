import { Crown, ArrowLeft } from 'lucide-react';

export default function LegacyLoading() {
  return (
    <div className="relative min-h-screen bg-[#050403] animate-pulse">
      <div className="pointer-events-none fixed inset-0 z-0">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(245,158,11,0.12)_0%,transparent_60%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_30%,rgba(0,0,0,0.9)_100%)]" />
      </div>

      <header className="relative z-10 mx-auto max-w-6xl px-6 pt-16 md:px-10 lg:pt-24">
        <div className="mb-12 flex items-center gap-4">
          <div className="flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.2em] text-amber-500/30">
            <ArrowLeft className="h-3 w-3" />
            Back to Explore
          </div>
        </div>

        <div className="mb-24 flex flex-col items-center text-center">
          <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-full border border-amber-500/10 bg-amber-500/5">
            <Crown className="h-7 w-7 text-amber-500/30" />
          </div>
          <div className="mb-4 h-12 md:h-16 lg:h-20 w-3/4 max-w-md bg-amber-500/10 rounded-xl" />
          <div className="h-4 md:h-5 w-full max-w-lg bg-amber-500/5 rounded-md mb-2" />
          <div className="h-4 md:h-5 w-3/4 max-w-sm bg-amber-500/5 rounded-md hidden md:block" />
        </div>
      </header>

      <main className="relative z-10 mx-auto max-w-6xl px-6 pb-32 md:px-10">
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="relative h-full overflow-hidden rounded-2xl border border-amber-500/10 bg-[#0a0705]">
              <div className="aspect-video w-full bg-amber-500/5" />
              <div className="p-5">
                <div className="mb-3 flex items-center justify-between">
                  <div className="h-2 w-16 bg-amber-500/10 rounded-sm" />
                  <div className="h-2 w-12 bg-amber-500/10 rounded-sm" />
                </div>
                <div className="mb-2 h-6 w-3/4 bg-amber-500/10 rounded-sm" />
                <div className="h-4 w-full bg-amber-500/5 rounded-sm mb-1" />
                <div className="h-4 w-5/6 bg-amber-500/5 rounded-sm" />
                
                <div className="mt-5 flex items-center justify-between border-t border-amber-500/10 pt-4">
                  <div className="h-3 w-20 bg-amber-500/10 rounded-sm" />
                  <div className="flex items-center gap-3">
                    <div className="h-3 w-6 bg-amber-500/10 rounded-sm" />
                    <div className="h-3 w-6 bg-amber-500/10 rounded-sm" />
                    <div className="h-3 w-6 bg-amber-500/10 rounded-sm" />
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
