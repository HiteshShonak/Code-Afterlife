"use client";

export function SectionLabel({ index, label }: { index: string; label: string }) {
  return (
    <div className="mb-10 flex items-center gap-4 font-mono text-[10px] uppercase tracking-[0.4em] text-muted-foreground">
      <span className="text-accent">{index}</span>
      <span className="h-px w-10 bg-foreground/20" />
      <span>{label}</span>
    </div>
  );
}