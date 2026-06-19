import { Code, Flame, History } from 'lucide-react';

export default function AboutLoading() {
  return (
    <div className="relative min-h-screen bg-[#030508] overflow-hidden">
      {/* Ambient background glows */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute top-[-20%] left-[-10%] h-[800px] w-[800px] rounded-full bg-slate-900/40 blur-[150px]" />
        <div className="absolute bottom-[-20%] right-[-10%] h-[900px] w-[900px] rounded-full bg-[#b87333]/5 blur-[200px]" />
        <div className="absolute top-[40%] left-[50%] -translate-x-1/2 -translate-y-1/2 h-[600px] w-[600px] rounded-full bg-amber-500/5 blur-[200px]" />
      </div>

      <div className="relative z-10 animate-pulse">
        {/* HERO SECTION */}
        <section className="relative flex min-h-[90vh] flex-col items-center justify-center px-6 text-center">
          <div className="flex flex-col items-center w-full">
            <div className="mb-8 flex items-center justify-center gap-4">
              <span className="h-px w-12 bg-amber-500/20" />
              <div className="h-4 w-40 bg-amber-500/20 rounded" />
              <span className="h-px w-12 bg-amber-500/20" />
            </div>
            
            <div className="h-20 sm:h-28 max-w-2xl w-full bg-white/10 rounded-xl mb-8" />
            <div className="h-10 sm:h-14 max-w-md w-full bg-white/10 rounded-xl mb-8" />
            
            <div className="h-6 max-w-2xl w-full bg-white/5 rounded-md mb-2" />
            <div className="h-6 max-w-xl w-full bg-white/5 rounded-md mb-16" />
            
            <div className="mt-10 flex items-center gap-1.5 opacity-30">
              <div className="h-10 w-px bg-gradient-to-b from-transparent via-white to-transparent" />
            </div>
          </div>
        </section>

        {/* MANIFESTO SECTIONS */}
        <div className="relative border-y border-white/5 bg-black/40 backdrop-blur-3xl py-32 md:py-48">
          <div className="mx-auto max-w-4xl px-6 flex flex-col gap-32 md:gap-48">
            {[Code, Flame, History].map((Icon, i) => (
              <div key={i} className="flex flex-col md:flex-row items-start gap-8 md:gap-16">
                <div className="flex-shrink-0 mt-2">
                  <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white/5 border border-white/10 text-white/10">
                    <Icon className="h-7 w-7" />
                  </div>
                </div>
                <div className="flex-1 w-full">
                  <div className="h-10 w-3/4 max-w-xs bg-white/10 rounded-lg mb-6" />
                  <div className="space-y-3 max-w-2xl">
                    <div className="h-5 w-full bg-white/5 rounded" />
                    <div className="h-5 w-[90%] bg-white/5 rounded" />
                    <div className="h-5 w-[80%] bg-white/5 rounded" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* CTA OUTRO */}
        <section className="relative flex min-h-[60vh] flex-col items-center justify-center px-6 text-center">
          <div className="flex flex-col items-center w-full">
            <div className="mb-10 flex items-center justify-center">
              <div className="h-24 w-px bg-amber-500/20" />
            </div>
            <div className="h-10 max-w-xl w-full bg-white/10 rounded-lg mb-8" />
            <div className="flex flex-col sm:flex-row items-center gap-4">
              <div className="h-14 w-64 bg-amber-500/10 rounded-full border border-amber-500/30" />
              <div className="h-14 w-40 bg-white/5 rounded-full border border-white/10" />
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
