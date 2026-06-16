import { memo } from 'react';
import { cn } from '@/lib/utils';
import type { ProjectState } from '@prisma/client';

const STATE_CONFIG: Record<
  ProjectState,
  { label: string; classes: string }
> = {
  BORN:    { label: 'Born',    classes: 'bg-sky-500/15 text-sky-300 border-sky-500/30' },
  ACTIVE:  { label: 'Active',  classes: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30' },
  STALLED: { label: 'Stalled', classes: 'bg-amber-500/15 text-amber-300 border-amber-500/30' },
  SHIPPED: { label: 'Shipped', classes: 'bg-violet-500/15 text-violet-300 border-violet-500/30' },
  DEAD:    { label: 'Dead',    classes: 'bg-neutral-500/15 text-neutral-500 border-neutral-500/20' },
};

interface StateBadgeProps {
  state: ProjectState;
  className?: string;
}

// state badge
export const StateBadge = memo(function StateBadge({ state, className }: StateBadgeProps) {
  const { label, classes } = STATE_CONFIG[state];
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-sm border px-2 py-0.5 font-mono text-[9px] uppercase tracking-[0.18em]',
        classes,
        className
      )}
    >
      {label}
    </span>
  );
});
