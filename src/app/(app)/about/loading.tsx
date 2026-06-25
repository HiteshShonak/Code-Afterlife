import { Activity, Code, GitFork, History, TimerReset } from 'lucide-react';

export default function AboutLoading() {
  return (
    <div className="min-h-screen overflow-x-clip bg-[#050608] text-foreground">
      <div className="animate-pulse">
        <section className="relative min-h-[86vh] overflow-hidden bg-[#090b0d]">
          <div className="absolute inset-0 bg-[url('/hero-image.webp')] bg-cover bg-center opacity-30" />
          <div className="absolute inset-0 bg-black/60" />
          <div className="absolute inset-x-0 bottom-0 h-1/3 bg-linear-to-t from-[#050608] to-transparent" />

          <div className="relative z-10 mx-auto flex min-h-[86vh] max-w-6xl flex-col justify-end px-4 pb-16 pt-32 sm:px-6 md:px-10 lg:pb-20">
            <div className="mb-4 h-3 w-48 rounded-sm bg-amber-300/18" />
            <div className="h-12 w-full max-w-[18rem] rounded-sm bg-white/12 sm:h-20 sm:max-w-[34rem] md:h-24" />
            <div className="mt-6 max-w-2xl space-y-3">
              <div className="h-4 w-full rounded-sm bg-white/10 sm:h-5" />
              <div className="h-4 w-5/6 rounded-sm bg-white/8 sm:h-5" />
            </div>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <div className="h-11 w-full rounded-sm border border-amber-300/20 bg-amber-300/8 sm:w-40" />
              <div className="h-11 w-full rounded-sm border border-white/12 bg-white/6 sm:w-32" />
            </div>
          </div>
        </section>

        <main>
          <section className="border-y border-white/8 bg-[#08090b]">
            <div className="mx-auto grid max-w-6xl gap-4 px-4 py-8 sm:grid-cols-3 sm:px-6 md:px-10">
              {[0, 1, 2].map((item) => (
                <div key={item} className="border-l border-white/10 py-2 pl-4">
                  <div className="h-8 w-24 rounded-sm bg-white/12" />
                  <div className="mt-2 h-4 w-36 rounded-sm bg-white/7" />
                </div>
              ))}
            </div>
          </section>

          <section className="mx-auto max-w-6xl px-4 py-20 sm:px-6 md:px-10 md:py-28">
            <div className="max-w-3xl">
              <div className="h-3 w-36 rounded-sm bg-cyan-300/14" />
              <div className="mt-4 h-20 w-full max-w-2xl rounded-sm bg-white/10 sm:h-28" />
              <div className="mt-6 space-y-3">
                <div className="h-4 w-full rounded-sm bg-white/7" />
                <div className="h-4 w-4/5 rounded-sm bg-white/7" />
              </div>
            </div>

            <div className="mt-12 grid gap-5 md:grid-cols-3">
              {[Code, Activity, GitFork].map((Icon, index) => (
                <article key={index} className="rounded-lg border border-white/10 bg-white/[0.035] p-5">
                  <div className="mb-5 flex items-center gap-3">
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-sm border border-white/10 bg-black/20 text-white/12">
                      <Icon className="h-5 w-5" />
                    </span>
                    <span className="h-3 w-20 rounded-sm bg-white/8" />
                  </div>
                  <div className="h-6 w-4/5 rounded-sm bg-white/10" />
                  <div className="mt-4 space-y-2">
                    <div className="h-3 w-full rounded-sm bg-white/7" />
                    <div className="h-3 w-11/12 rounded-sm bg-white/7" />
                    <div className="h-3 w-3/4 rounded-sm bg-white/7" />
                  </div>
                </article>
              ))}
            </div>
          </section>

          <section className="bg-[#0b0b0a]">
            <div className="mx-auto grid max-w-6xl gap-10 px-4 py-20 sm:px-6 md:px-10 lg:grid-cols-[0.8fr_1.2fr] lg:py-28">
              <div>
                <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-sm border border-emerald-300/20 bg-emerald-300/8 text-white/12">
                  <TimerReset className="h-6 w-6" />
                </div>
                <div className="h-3 w-28 rounded-sm bg-emerald-200/14" />
                <div className="mt-4 h-20 w-full max-w-md rounded-sm bg-white/10 sm:h-24" />
                <div className="mt-5 space-y-3">
                  <div className="h-4 w-full max-w-lg rounded-sm bg-white/7" />
                  <div className="h-4 w-3/4 rounded-sm bg-white/7" />
                </div>
              </div>

              <div className="grid gap-3">
                {[0, 1, 2, 3, 4].map((item) => (
                  <div key={item} className="grid gap-2 border border-white/10 bg-white/[0.025] px-4 py-4 sm:grid-cols-[8rem_1fr] sm:items-center">
                    <div className="flex items-center gap-3">
                      <div className="h-3 w-5 rounded-sm bg-white/6" />
                      <div className="h-4 w-24 rounded-sm bg-white/10" />
                    </div>
                    <div className="h-4 w-full rounded-sm bg-white/7" />
                  </div>
                ))}
              </div>
            </div>
          </section>

          <section className="mx-auto flex max-w-6xl flex-col items-start gap-8 px-4 py-20 sm:px-6 md:px-10 md:py-28 lg:flex-row lg:items-center lg:justify-between">
            <div className="max-w-2xl">
              <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-sm border border-rose-300/20 bg-rose-300/8 text-white/12">
                <History className="h-6 w-6" />
              </div>
              <div className="h-24 w-full max-w-2xl rounded-sm bg-white/10 sm:h-28" />
              <div className="mt-6 h-4 w-4/5 rounded-sm bg-white/7" />
            </div>
            <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row lg:flex-col">
              <div className="h-11 w-full rounded-sm border border-white/12 bg-white/6 sm:w-44" />
              <div className="h-11 w-full rounded-sm border border-amber-300/20 bg-amber-300/8 sm:w-40" />
            </div>
          </section>
        </main>
      </div>
    </div>
  );
}
