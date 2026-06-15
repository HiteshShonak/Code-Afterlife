import { HEALTH_CONFIG } from '@/config/health';
import { clamp, daysBetween } from '@/lib/utils';
import type { DecayState, HealthCalculationInput, HealthBucket } from '@/types/health';

const { weights, thresholds } = HEALTH_CONFIG;

// calc health score
export function calculateHealth(input: HealthCalculationInput): number {
  const { lastActivityAt, createdAt, commitsThisMonth, commitsLastMonth } = input;

  // activity score
  const activityScore =
    clamp(commitsThisMonth / HEALTH_CONFIG.activity.maxCommits, 0, 1) * 100;

  // consistency score
  const referenceDate = lastActivityAt || createdAt;
  const daysSince = daysBetween(referenceDate, new Date());
  const consistencyScore =
    clamp(1 - daysSince / HEALTH_CONFIG.deadDays, 0, 1) * 100;

  // momentum score
  let momentumScore: number;
  if (commitsThisMonth > commitsLastMonth) {
    momentumScore = 100;
  } else if (commitsThisMonth === commitsLastMonth) {
    momentumScore = 50;
  } else {
    momentumScore = 0;
  }

  // total
  const health =
    activityScore * weights.activity +
    consistencyScore * weights.consistency +
    momentumScore * weights.momentum;

  return Math.round(clamp(health, 0, 100) * 10) / 10;
}

// map health to state
export function getDecayState(health: number): DecayState {
  if (health >= thresholds.thriving) return 'thriving';
  if (health >= thresholds.stable) return 'stable';
  if (health >= thresholds.unstable) return 'unstable';
  if (health >= thresholds.nearDeath) return 'nearDeath';
  return 'dead';
}

// style maps
const BUCKET_META: Record<DecayState, { label: string; color: string }> = {
  thriving:  { label: 'Thriving',   color: 'var(--health-thriving)' },
  stable:    { label: 'Stable',     color: 'var(--health-stable)' },
  unstable:  { label: 'Unstable',   color: 'var(--health-unstable)' },
  nearDeath: { label: 'Near Death', color: 'var(--health-near-death)' },
  dead:      { label: 'Dead',       color: 'var(--health-dead)' },
};

// get health bucket
export function getHealthBucket(health: number): HealthBucket {
  const state = getDecayState(health);
  const meta = BUCKET_META[state];
  return { state, ...meta };
}
