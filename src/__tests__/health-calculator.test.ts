import { describe, it, expect } from 'vitest';
import {
  calculateHealth,
  getDecayState,
  getHealthBucket,
} from '@/lib/health-calculator';

// ─── helpers ─────────────────────────────────────────────────────────────────

function daysAgo(days: number): Date {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d;
}

// Base input for a recently-active project
const baseInput = {
  state: 'ACTIVE' as const,
  createdAt: daysAgo(60),
  lastActivityAt: daysAgo(2),
  commitsThisMonth: 20,
  commitsLastMonth: 10,
};

// ─── calculateHealth ──────────────────────────────────────────────────────────

describe('calculateHealth', () => {
  it('returns a number between 0 and 100', () => {
    const score = calculateHealth(baseInput);
    expect(score).toBeGreaterThanOrEqual(0);
    expect(score).toBeLessThanOrEqual(100);
  });

  it('thriving project: high commits, recent activity, accelerating → high score', () => {
    const score = calculateHealth({
      state: 'ACTIVE',
      createdAt: daysAgo(90),
      lastActivityAt: daysAgo(1),
      commitsThisMonth: 80,
      commitsLastMonth: 30,
    });
    // capped at 95 for ACTIVE
    expect(score).toBeGreaterThan(80);
    expect(score).toBeLessThanOrEqual(95);
  });

  it('dead project: no activity for 120 days → score near 0', () => {
    const score = calculateHealth({
      state: 'DEAD',
      createdAt: daysAgo(200),
      lastActivityAt: daysAgo(120),
      commitsThisMonth: 0,
      commitsLastMonth: 0,
    });
    expect(score).toBe(0); // 120 days since dead is well beyond max 10 threshold
  });


  it('steady project: same commits month over month → moderate momentum (50)', () => {
    const score = calculateHealth({
      state: 'ACTIVE',
      createdAt: daysAgo(60),
      lastActivityAt: daysAgo(1),
      commitsThisMonth: 15,
      commitsLastMonth: 15,
    });
    // momentum = 50 (steady)
    // Verify score is middle-range
    expect(score).toBeGreaterThan(30);
    expect(score).toBeLessThan(80);
  });

  it('decelerating project: fewer commits than last month → momentum=0', () => {
    const slower = calculateHealth({
      state: 'ACTIVE',
      createdAt: daysAgo(60),
      lastActivityAt: daysAgo(5),
      commitsThisMonth: 5,
      commitsLastMonth: 40,
    });
    const accelerating = calculateHealth({
      state: 'ACTIVE',
      createdAt: daysAgo(60),
      lastActivityAt: daysAgo(5),
      commitsThisMonth: 5,
      commitsLastMonth: 3,
    });
    // Decelerating should score lower than accelerating (same activity + consistency)
    expect(slower).toBeLessThan(accelerating);
  });

  it('uses createdAt as fallback when lastActivityAt is null', () => {
    // BORN project with no activity yet - should not crash
    const score = calculateHealth({
      state: 'BORN',
      createdAt: daysAgo(1),
      lastActivityAt: null,
      commitsThisMonth: 0,
      commitsLastMonth: 0,
    });
    expect(score).toBeGreaterThanOrEqual(0);
    expect(score).toBeLessThanOrEqual(100);
  });

  it('caps commit count at maxCommits - does not exceed max activity score', () => {
    const score = calculateHealth({
      state: 'ACTIVE',
      createdAt: daysAgo(60),
      lastActivityAt: daysAgo(1),
      commitsThisMonth: 999, // Way over max
      commitsLastMonth: 0,
    });
    // activity score clamped to 100 * 0.4 = 40
    expect(score).toBeLessThanOrEqual(100);
  });

  it('returns a value rounded to one decimal place', () => {
    const score = calculateHealth(baseInput);
    // Round-trip: parse to 1 decimal, should be same
    expect(score).toBe(parseFloat(score.toFixed(1)));
  });
});

// ─── getDecayState ────────────────────────────────────────────────────────────

describe('getDecayState', () => {
  // Thresholds: thriving>=80, stable>=60, unstable>=40, nearDeath>=20, dead<20

  it('80 → thriving', () => {
    expect(getDecayState(80)).toBe('thriving');
  });

  it('100 → thriving', () => {
    expect(getDecayState(100)).toBe('thriving');
  });

  it('79 → stable', () => {
    expect(getDecayState(79)).toBe('stable');
  });

  it('60 → stable', () => {
    expect(getDecayState(60)).toBe('stable');
  });

  it('59 → unstable', () => {
    expect(getDecayState(59)).toBe('unstable');
  });

  it('40 → unstable', () => {
    expect(getDecayState(40)).toBe('unstable');
  });

  it('39 → nearDeath', () => {
    expect(getDecayState(39)).toBe('nearDeath');
  });

  it('20 → nearDeath', () => {
    expect(getDecayState(20)).toBe('nearDeath');
  });

  it('19 → dead', () => {
    expect(getDecayState(19)).toBe('dead');
  });

  it('0 → dead', () => {
    expect(getDecayState(0)).toBe('dead');
  });
});

// ─── getHealthBucket ──────────────────────────────────────────────────────────

describe('getHealthBucket', () => {
  it('returns correct state label and color token for thriving', () => {
    const bucket = getHealthBucket(90);
    expect(bucket.state).toBe('thriving');
    expect(bucket.label).toBe('Thriving');
    expect(bucket.color).toContain('var(--health-');
  });

  it('returns correct state for each threshold boundary', () => {
    expect(getHealthBucket(80).state).toBe('thriving');
    expect(getHealthBucket(60).state).toBe('stable');
    expect(getHealthBucket(40).state).toBe('unstable');
    expect(getHealthBucket(20).state).toBe('nearDeath');
    expect(getHealthBucket(0).state).toBe('dead');
  });

  it('bucket object has state, label, and color properties', () => {
    const bucket = getHealthBucket(50);
    expect(bucket).toHaveProperty('state');
    expect(bucket).toHaveProperty('label');
    expect(bucket).toHaveProperty('color');
  });
});
