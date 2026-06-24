import { describe, expect, it } from 'vitest';
import { stateMachine } from '@/lib/state-machine';

function daysAgo(days: number): Date {
  const date = new Date();
  date.setDate(date.getDate() - days);
  return date;
}

describe('stateMachine.canTransition', () => {
  it('allows matrix-valid transitions without a source context', () => {
    expect(stateMachine.canTransition('BORN', 'ACTIVE')).toBe(true);
    expect(stateMachine.canTransition('ACTIVE', 'DEAD')).toBe(true);
    expect(stateMachine.canTransition('STALLED', 'ACTIVE')).toBe(true);
    expect(stateMachine.canTransition('DEAD', 'ACTIVE')).toBe(true);
  });

  it('rejects matrix-invalid transitions', () => {
    expect(stateMachine.canTransition('BORN', 'SHIPPED')).toBe(false);
    expect(stateMachine.canTransition('ACTIVE', 'BORN')).toBe(false);
    expect(stateMachine.canTransition('STALLED', 'SHIPPED')).toBe(false);
    expect(stateMachine.canTransition('SHIPPED', 'ACTIVE')).toBe(false);
  });

  it('blocks manual revival transitions', () => {
    expect(
      stateMachine.canTransition('STALLED', 'ACTIVE', { source: 'manual' })
    ).toBe(false);
    expect(
      stateMachine.canTransition('DEAD', 'ACTIVE', { source: 'manual' })
    ).toBe(false);
  });

  it('allows AI-driven revival transitions', () => {
    expect(
      stateMachine.canTransition('STALLED', 'ACTIVE', { source: 'ai_pulse' })
    ).toBe(true);
    expect(
      stateMachine.canTransition('DEAD', 'ACTIVE', { source: 'ai_pulse' })
    ).toBe(true);
  });

  it('allows same-state transitions for every source', () => {
    expect(stateMachine.canTransition('BORN', 'BORN', { source: 'manual' })).toBe(true);
    expect(
      stateMachine.canTransition('ACTIVE', 'ACTIVE', { source: 'health_cron' })
    ).toBe(true);
  });
});

describe('stateMachine.getValidTransitions', () => {
  it('returns the full matrix when no source is provided', () => {
    expect(stateMachine.getValidTransitions('BORN')).toEqual(['ACTIVE', 'STALLED', 'DEAD']);
    expect(stateMachine.getValidTransitions('ACTIVE')).toEqual(['STALLED', 'SHIPPED', 'DEAD']);
    expect(stateMachine.getValidTransitions('STALLED')).toEqual(['ACTIVE', 'DEAD']);
    expect(stateMachine.getValidTransitions('DEAD')).toEqual(['ACTIVE']);
    expect(stateMachine.getValidTransitions('SHIPPED')).toEqual([]);
  });

  it('filters transitions by source when context is provided', () => {
    expect(stateMachine.getValidTransitions('STALLED', { source: 'manual' })).toEqual(['DEAD']);
    expect(stateMachine.getValidTransitions('DEAD', { source: 'manual' })).toEqual([]);
    expect(stateMachine.getValidTransitions('DEAD', { source: 'ai_pulse' })).toEqual(['ACTIVE']);
  });
});

describe('stateMachine.validateTransition', () => {
  it('does not throw for valid transitions', () => {
    expect(() => stateMachine.validateTransition('ACTIVE', 'DEAD')).not.toThrow();
    expect(() =>
      stateMachine.validateTransition('DEAD', 'ACTIVE', { source: 'ai_pulse' })
    ).not.toThrow();
  });

  it('throws for matrix-invalid transitions', () => {
    expect(() => stateMachine.validateTransition('SHIPPED', 'ACTIVE')).toThrow(
      /Cannot transition/
    );
  });

  it('throws a descriptive error for invalid sources', () => {
    expect(() =>
      stateMachine.validateTransition('STALLED', 'ACTIVE', { source: 'manual' })
    ).toThrow(/manual transitions cannot move a project from STALLED to ACTIVE/);
  });
});

describe('stateMachine.evaluateState', () => {
  it('keeps SHIPPED terminal', () => {
    const result = stateMachine.evaluateState({
      state: 'SHIPPED',
      lastActivityAt: daysAgo(30),
      createdAt: daysAgo(60),
    });

    expect(result).toBe('SHIPPED');
  });

  it('keeps DEAD terminal during health evaluation', () => {
    const result = stateMachine.evaluateState({
      state: 'DEAD',
      lastActivityAt: daysAgo(10),
      createdAt: daysAgo(60),
    });

    expect(result).toBe('DEAD');
  });

  it('keeps a fresh BORN project in BORN', () => {
    const result = stateMachine.evaluateState({
      state: 'BORN',
      lastActivityAt: null,
      createdAt: daysAgo(0),
    });

    expect(result).toBe('BORN');
  });

  it('decays BORN to STALLED after exactly 1 day', () => {
    const result = stateMachine.evaluateState({
      state: 'BORN',
      lastActivityAt: null,
      createdAt: daysAgo(1),
    });

    expect(result).toBe('STALLED');
  });

  it('decays ACTIVE to STALLED after exactly 1 day of inactivity', () => {
    const result = stateMachine.evaluateState({
      state: 'ACTIVE',
      lastActivityAt: daysAgo(1),
      createdAt: daysAgo(30),
    });

    expect(result).toBe('STALLED');
  });

  it('decays ACTIVE straight to DEAD after 3 days of inactivity', () => {
    const result = stateMachine.evaluateState({
      state: 'ACTIVE',
      lastActivityAt: daysAgo(3),
      createdAt: daysAgo(30),
    });

    expect(result).toBe('DEAD');
  });

  it('returns ACTIVE again when a stalled project has fresh activity', () => {
    const result = stateMachine.evaluateState({
      state: 'STALLED',
      lastActivityAt: daysAgo(0),
      createdAt: daysAgo(30),
    });

    expect(result).toBe('ACTIVE');
  });

  it('falls back to createdAt when lastActivityAt is null', () => {
    const result = stateMachine.evaluateState({
      state: 'ACTIVE',
      lastActivityAt: null,
      createdAt: daysAgo(3),
    });

    expect(result).toBe('DEAD');
  });
});
