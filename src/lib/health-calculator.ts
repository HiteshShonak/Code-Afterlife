import { HEALTH_CONFIG } from '@/config/health';
import { clamp, daysBetween } from '@/lib/utils';
import type { DecayState, HealthCalculationInput, HealthBucket } from '@/types/health';

const { weights, thresholds } = HEALTH_CONFIG;

/**
 * Calculate project health score (0-100) from activity metrics.
 *
 * Three components:
 * - **Activity** (40%): Normalized commits this month vs max threshold
 * - **Consistency** (30%): Inverse of days since last activity
 * - **Momentum** (30%): Is commit velocity increasing, steady, or decreasing?
 */
export function calculateHealth(input: HealthCalculationInput): number {
  const { lastActivityAt, createdAt, commitsThisMonth, commitsLastMonth } = input;

  // Activity score: normalized commits this month
  const activityScore =
    clamp(commitsThisMonth / HEALTH_CONFIG.activity.maxCommits, 0, 1) * 100;

  // Consistency score: inverse of days since last activity
  const referenceDate = lastActivityAt || createdAt;
  const daysSince = daysBetween(referenceDate, new Date());
  const consistencyScore =
    clamp(1 - daysSince / HEALTH_CONFIG.deadDays, 0, 1) * 100;

  // Momentum score: is velocity increasing?
  let momentumScore: number;
  if (commitsThisMonth > commitsLastMonth) {
    momentumScore = 100; // Accelerating
  } else if (commitsThisMonth === commitsLastMonth) {
    momentumScore = 50;  // Steady
  } else {
    momentumScore = 0;   // Decelerating
  }

  // Weighted sum
  const health =
    activityScore * weights.activity +
    consistencyScore * weights.consistency +
    momentumScore * weights.momentum;

  return Math.round(clamp(health, 0, 100) * 10) / 10; // One decimal place
}

/**
 * Map a health score to its decay state for visual rendering.
 * Uses thresholds from HEALTH_CONFIG.
 */
export function getDecayState(health: number): DecayState {
  if (health >= thresholds.thriving) return 'thriving';
  if (health >= thresholds.stable) return 'stable';
  if (health >= thresholds.unstable) return 'unstable';
  if (health >= thresholds.nearDeath) return 'nearDeath';
  return 'dead';
}

/** Label and color mappings per decay state. */
const BUCKET_META: Record<DecayState, { label: string; color: string }> = {
  thriving:  { label: 'Thriving',   color: 'var(--health-thriving)' },
  stable:    { label: 'Stable',     color: 'var(--health-stable)' },
  unstable:  { label: 'Unstable',   color: 'var(--health-unstable)' },
  nearDeath: { label: 'Near Death', color: 'var(--health-near-death)' },
  dead:      { label: 'Dead',       color: 'var(--health-dead)' },
};

/**
 * Get full health bucket info including decay state, label, and CSS color token.
 * Used by frontend components and API responses.
 */
export function getHealthBucket(health: number): HealthBucket {
  const state = getDecayState(health);
  const meta = BUCKET_META[state];
  return { state, ...meta };
}
