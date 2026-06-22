"use client";

import { useReveal } from "@/hooks/use-reveal";
import { SectionLabel } from "./SectionLabel";

const revived = [
  { name: "StudyOS", origin: "from StudyFlow", builder: "@mira_ng", stars: "12.4k", uptime: "99.98%" },
  { name: "Quiet Notes", origin: "from QuickNote API", builder: "@theo_w", stars: "4.1k", uptime: "99.91%" },
  { name: "Foundry", origin: "from FocusHub", builder: "@orion.dev", stars: "8.7k", uptime: "99.96%" },
];

export function LegacyHall() {
  const ref = useReveal<HTMLDivElement>();
  return (
    <section id="legacy" className="relative border-t border-border/60 px-6 py-32 md:py-40">
      <div className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-96 bg-linear-to-b from-accent/6 via-transparent to-transparent" />
      <div ref={ref} className="ca-reveal mx-auto max-w-7xl">
        <SectionLabel index="05" label="Legacy hall" />
        <div className="mb-16 flex flex-col items-start justify-between gap-6 md:flex-row md:items-end">
          <h2 className="max-w-2xl text-balance text-4xl font-extrabold tracking-[-0.03em] md:text-6xl">
            And some came back to life.
          </h2>
          <p className="max-w-sm text-sm leading-relaxed text-muted-foreground">
            Projects revived by their next builder. Their original architects
            still listed in the lineage - credit endures.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-px overflow-hidden rounded-lg border border-border/60 bg-border/60 md:grid-cols-3">
          {revived.map((p) => (
            <div
              key={p.name}
              className="group relative bg-background p-8 transition-colors hover:bg-card"
            >
              <div className="mb-10 flex items-center justify-between">
                <span className="font-mono text-[10px] uppercase tracking-[0.3em] text-accent">
                  Alive
                </span>
                <span className="inline-block size-1.5 rounded-full bg-accent ca-pulse-dot" />
              </div>
              <h3 className="text-3xl font-bold tracking-tight">{p.name}</h3>
              <p className="mt-2 font-mono text-[10px] uppercase tracking-[0.22em] text-muted-foreground">
                {p.origin} · revived by {p.builder}
              </p>
              <dl className="mt-10 grid grid-cols-2 gap-6 border-t border-border/60 pt-6 font-mono text-[11px]">
                <div>
                  <dt className="text-[9px] uppercase tracking-[0.3em] text-muted-foreground">Stars</dt>
                  <dd className="mt-1 text-lg font-semibold tracking-tight text-foreground">{p.stars}</dd>
                </div>
                <div>
                  <dt className="text-[9px] uppercase tracking-[0.3em] text-muted-foreground">Uptime</dt>
                  <dd className="mt-1 text-lg font-semibold tracking-tight text-foreground">{p.uptime}</dd>
                </div>
              </dl>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}