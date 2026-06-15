import type { DecayState } from '@/types/health';
import type { ProjectState } from '@prisma/client';

// state to decay map
export function projectStateToDecay(
  state: ProjectState,
  health: number
): DecayState {
  if (state === 'DEAD') return 'dead';
  if (state === 'SHIPPED') return 'thriving';
  if (health >= 80) return 'thriving';
  if (health >= 60) return 'stable';
  if (health >= 40) return 'unstable';
  if (health >= 20) return 'nearDeath';
  return 'dead';
}

// state labels
export const STATE_LABELS: Record<ProjectState, string> = {
  BORN: 'Born',
  ACTIVE: 'Active',
  STALLED: 'Stalled',
  SHIPPED: 'Shipped',
  DEAD: 'Dead',
};

// state colors
export const STATE_COLORS: Record<ProjectState, string> = {
  BORN: 'var(--health-stable)',
  ACTIVE: 'var(--health-thriving)',
  STALLED: 'var(--health-unstable)',
  SHIPPED: 'var(--health-thriving)',
  DEAD: 'var(--health-dead)',
};

// state badge classes
export const STATE_BADGE_CLASSES: Record<ProjectState, string> = {
  BORN: 'bg-sky-500/15 text-sky-300 border-sky-500/30',
  ACTIVE: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30',
  STALLED: 'bg-amber-500/15 text-amber-300 border-amber-500/30',
  SHIPPED: 'bg-violet-500/15 text-violet-300 border-violet-500/30',
  DEAD: 'bg-neutral-500/15 text-neutral-400 border-neutral-500/30',
};
