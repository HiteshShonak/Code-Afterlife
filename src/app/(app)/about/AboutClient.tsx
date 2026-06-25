'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useRef } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import { Activity, Code, Flame, GitFork, History, TimerReset } from 'lucide-react';
import { CINEMATIC_EASE } from '@/lib/utils/animation';

const fadeUp = {
  initial: { opacity: 0, y: 24 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, amount: 0.25 },
  transition: { duration: 0.9, ease: CINEMATIC_EASE },
};

const fadeUpStagger = (delay: number) => ({
  initial: { opacity: 0, y: 24 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.9, delay, ease: CINEMATIC_EASE },
});

const principles = [
  {
    icon: Code,
    label: 'Archive',
    title: 'Projects deserve a record.',
    body: 'A side project can stop moving without becoming meaningless. Code Afterlife keeps the repository, stack, story, and timeline readable after momentum fades.',
  },
  {
    icon: Activity,
    label: 'Lifecycle',
    title: 'Health should tell the truth.',
    body: 'Projects begin, move, stall, ship, or die based on activity. The point is not judgment. It is a clear signal for builders and visitors.',
  },
  {
    icon: GitFork,
    label: 'Lineage',
    title: 'Old work can become new work.',
    body: 'A dead project can be resurrected as a fork, rewrite, or successor. The original stays credited, and the next generation keeps its ancestry.',
  },
] as const;

const lifecycle = [
  { state: 'Born', detail: 'A project enters the archive with a fresh pulse.' },
  { state: 'Active', detail: 'New owner activity or fresh commits prove the project is moving.' },
  { state: 'Stalled', detail: 'Seven quiet days mark the first visible decay.' },
  { state: 'Dead', detail: 'Thirty quiet days move it into the graveyard.' },
  { state: 'Shipped or resurrected', detail: 'A finished project can be sealed, and a dead one can begin a new lineage.' },
] as const;

export function AboutClient() {
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ['start start', 'end start'],
  });
  const titleOpacity = useTransform(scrollYProgress, [0, 0.65], [1, 0.35]);

  return (
    <div ref={containerRef} className="min-h-screen overflow-x-clip bg-[#050608] text-foreground">
      <section className="relative min-h-[86vh] overflow-hidden">
        <Image
          src="/hero-image.webp"
          alt=""
          fill
          priority
          sizes="100vw"
          className="object-cover"
        />
        <div className="absolute inset-0 bg-black/55" />
        <div className="absolute inset-x-0 bottom-0 h-1/3 bg-linear-to-t from-[#050608] to-transparent" />

        <motion.div
          style={{ opacity: titleOpacity }}
          className="relative z-10 mx-auto flex min-h-[86vh] max-w-6xl flex-col justify-end px-4 pb-16 pt-32 sm:px-6 md:px-10 lg:pb-20"
        >
          <motion.p
            {...fadeUpStagger(0)}
            className="mb-4 font-mono text-[10px] font-semibold uppercase tracking-[0.24em] text-amber-300/80"
          >
            The graveyard is alive
          </motion.p>
          <motion.h1
            {...fadeUpStagger(0.12)}
            className="max-w-4xl text-balance font-mono text-4xl font-extrabold leading-tight text-white sm:text-6xl md:text-7xl"
          >
            Code Afterlife
          </motion.h1>
          <motion.p
            {...fadeUpStagger(0.24)}
            className="mt-6 max-w-2xl text-base leading-7 text-white/72 sm:text-lg"
          >
            A living archive for abandoned projects, shipped experiments, stalled builds, and the second lives they earn later.
          </motion.p>
          <motion.div {...fadeUpStagger(0.36)} className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link
              href="/explore"
              className="inline-flex items-center justify-center rounded-sm border border-amber-300/35 bg-amber-300/10 px-5 py-3 font-mono text-[11px] font-semibold uppercase tracking-[0.14em] text-amber-200 transition-colors hover:bg-amber-300/18"
            >
              Explore Projects
            </Link>
            <Link
              href="/dashboard"
              className="inline-flex items-center justify-center rounded-sm border border-white/18 bg-white/6 px-5 py-3 font-mono text-[11px] font-semibold uppercase tracking-[0.14em] text-white/76 transition-colors hover:bg-white/10 hover:text-white"
            >
              Add Yours
            </Link>
          </motion.div>
        </motion.div>
      </section>

      <main className="relative z-10">
        <section className="border-y border-white/8 bg-[#08090b]">
          <div className="mx-auto grid max-w-6xl gap-4 px-4 py-8 sm:grid-cols-3 sm:px-6 md:px-10">
            {[
              ['7 days', 'to stall without activity'],
              ['30 days', 'to enter the graveyard'],
              ['Forever', 'for lineage and credit'],
            ].map(([value, label]) => (
              <div key={value} className="border-l border-white/10 py-2 pl-4">
                <p className="font-mono text-2xl font-bold text-white">{value}</p>
                <p className="mt-1 text-sm text-white/50">{label}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-4 py-20 sm:px-6 md:px-10 md:py-28">
          <motion.div {...fadeUp} className="max-w-3xl">
            <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.22em] text-cyan-300/70">
              Why it exists
            </p>
            <h2 className="mt-4 text-balance font-mono text-3xl font-bold leading-tight text-white sm:text-5xl">
              Most projects do not end cleanly. They drift.
            </h2>
            <p className="mt-6 text-base leading-7 text-white/58 sm:text-lg">
              Code Afterlife gives that drift a shape. It turns unfinished work into something browsable, forkable, and historically useful, without pretending every repository needs to be a startup.
            </p>
          </motion.div>

          <div className="mt-12 grid gap-5 md:grid-cols-3">
            {principles.map((item, index) => {
              const Icon = item.icon;
              return (
                <motion.article
                  key={item.title}
                  {...fadeUp}
                  transition={{ duration: 0.9, delay: index * 0.08, ease: CINEMATIC_EASE }}
                  className="rounded-lg border border-white/10 bg-white/[0.035] p-5"
                >
                  <div className="mb-5 flex items-center gap-3">
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-sm border border-white/10 bg-black/20 text-amber-200">
                      <Icon className="h-5 w-5" />
                    </span>
                    <span className="font-mono text-[10px] font-semibold uppercase tracking-[0.18em] text-white/38">
                      {item.label}
                    </span>
                  </div>
                  <h3 className="font-mono text-lg font-semibold leading-snug text-white">
                    {item.title}
                  </h3>
                  <p className="mt-4 text-sm leading-6 text-white/52">{item.body}</p>
                </motion.article>
              );
            })}
          </div>
        </section>

        <section className="bg-[#0b0b0a]">
          <div className="mx-auto grid max-w-6xl gap-10 px-4 py-20 sm:px-6 md:px-10 lg:grid-cols-[0.8fr_1.2fr] lg:py-28">
            <motion.div {...fadeUp}>
              <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-sm border border-emerald-300/20 bg-emerald-300/8 text-emerald-200">
                <TimerReset className="h-6 w-6" />
              </div>
              <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.22em] text-emerald-200/70">
                Lifecycle
              </p>
              <h2 className="mt-4 text-balance font-mono text-3xl font-bold leading-tight text-white sm:text-4xl">
                The archive changes when the code does.
              </h2>
              <p className="mt-5 text-sm leading-6 text-white/55 sm:text-base">
                Automated checks keep the lifecycle honest. New activity can wake a project; silence moves it toward the graveyard.
              </p>
            </motion.div>

            <div className="grid gap-3">
              {lifecycle.map((item, index) => (
                <motion.div
                  key={item.state}
                  {...fadeUp}
                  transition={{ duration: 0.9, delay: index * 0.07, ease: CINEMATIC_EASE }}
                  className="grid gap-2 border border-white/10 bg-white/[0.025] px-4 py-4 sm:grid-cols-[8rem_1fr] sm:items-center"
                >
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-[10px] text-white/30">
                      {String(index + 1).padStart(2, '0')}
                    </span>
                    <span className="font-mono text-sm font-semibold text-white">{item.state}</span>
                  </div>
                  <p className="text-sm leading-6 text-white/52">{item.detail}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        <section className="mx-auto flex max-w-6xl flex-col items-start gap-8 px-4 py-20 sm:px-6 md:px-10 md:py-28 lg:flex-row lg:items-center lg:justify-between">
          <motion.div {...fadeUp} className="max-w-2xl">
            <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-sm border border-rose-300/20 bg-rose-300/8 text-rose-200">
              <History className="h-6 w-6" />
            </div>
            <h2 className="text-balance font-mono text-3xl font-bold leading-tight text-white sm:text-5xl">
              Preserve the attempt. Credit the spark. Continue the line.
            </h2>
            <p className="mt-6 text-base leading-7 text-white/56">
              The archive is for builders who know that even unfinished work can teach, inspire, and become useful again.
            </p>
          </motion.div>

          <motion.div {...fadeUp} className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row lg:flex-col">
            <Link
              href="/graveyard"
              className="inline-flex items-center justify-center gap-2 rounded-sm border border-white/14 bg-white/5 px-5 py-3 font-mono text-[11px] font-semibold uppercase tracking-[0.14em] text-white/76 transition-colors hover:bg-white/10 hover:text-white"
            >
              <Flame className="h-4 w-4" />
              Visit Graveyard
            </Link>
            <Link
              href="/new"
              className="inline-flex items-center justify-center rounded-sm border border-amber-300/35 bg-amber-300/10 px-5 py-3 font-mono text-[11px] font-semibold uppercase tracking-[0.14em] text-amber-200 transition-colors hover:bg-amber-300/18"
            >
              Start a Project
            </Link>
          </motion.div>
        </section>
      </main>
    </div>
  );
}
