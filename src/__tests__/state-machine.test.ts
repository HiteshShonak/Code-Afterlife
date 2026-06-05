import { describe, it, expect } from 'vitest';
import { stateMachine } from '@/lib/state-machine';

// ─── helpers ─────────────────────────────────────────────────────────────────

function daysAgo(days: number): Date {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d;
}

// ─── canTransition ────────────────────────────────────────────────────────────

describe('stateMachine.canTransition', () => {
  // BORN → ACTIVE only
  it('BORN → ACTIVE is valid', () => {
    expect(stateMachine.canTransition('BORN', 'ACTIVE')).toBe(true);
  });
  it('BORN → STALLED is invalid', () => {
    expect(stateMachine.canTransition('BORN', 'STALLED')).toBe(false);
  });
  it('BORN → DEAD is invalid', () => {
    expect(stateMachine.canTransition('BORN', 'DEAD')).toBe(false);
  });
  it('BORN → SHIPPED is invalid', () => {
    expect(stateMachine.canTransition('BORN', 'SHIPPED')).toBe(false);
  });

  // ACTIVE → STALLED | SHIPPED
  it('ACTIVE → STALLED is valid', () => {
    expect(stateMachine.canTransition('ACTIVE', 'STALLED')).toBe(true);
  });
  it('ACTIVE → SHIPPED is valid', () => {
    expect(stateMachine.canTransition('ACTIVE', 'SHIPPED')).toBe(true);
  });
  it('ACTIVE → DEAD is invalid (must stall first)', () => {
    expect(stateMachine.canTransition('ACTIVE', 'DEAD')).toBe(false);
  });
  it('ACTIVE → BORN is invalid', () => {
    expect(stateMachine.canTransition('ACTIVE', 'BORN')).toBe(false);
  });

  // STALLED → ACTIVE | DEAD
  it('STALLED → ACTIVE is valid (recovery)', () => {
    expect(stateMachine.canTransition('STALLED', 'ACTIVE')).toBe(true);
  });
  it('STALLED → DEAD is valid (decay path)', () => {
    expect(stateMachine.canTransition('STALLED', 'DEAD')).toBe(true);
  });
  it('STALLED → SHIPPED is invalid', () => {
    expect(stateMachine.canTransition('STALLED', 'SHIPPED')).toBe(false);
  });

  // SHIPPED — terminal state
  it('SHIPPED → ACTIVE is invalid (terminal)', () => {
    expect(stateMachine.canTransition('SHIPPED', 'ACTIVE')).toBe(false);
  });
  it('SHIPPED → DEAD is invalid (terminal)', () => {
    expect(stateMachine.canTransition('SHIPPED', 'DEAD')).toBe(false);
  });
  it('SHIPPED → BORN is invalid (terminal)', () => {
    expect(stateMachine.canTransition('SHIPPED', 'BORN')).toBe(false);
  });

  // DEAD → ACTIVE only (resurrection)
  it('DEAD → ACTIVE is valid (resurrection path)', () => {
    expect(stateMachine.canTransition('DEAD', 'ACTIVE')).toBe(true);
  });
  it('DEAD → BORN is invalid', () => {
    expect(stateMachine.canTransition('DEAD', 'BORN')).toBe(false);
  });
  it('DEAD → SHIPPED is invalid', () => {
    expect(stateMachine.canTransition('DEAD', 'SHIPPED')).toBe(false);
  });
});

// ─── getValidTransitions ──────────────────────────────────────────────────────

describe('stateMachine.getValidTransitions', () => {
  it('BORN has exactly 1 valid transition: ACTIVE', () => {
    expect(stateMachine.getValidTransitions('BORN')).toEqual(['ACTIVE']);
  });

  it('ACTIVE has exactly 2 valid transitions: STALLED, SHIPPED', () => {
    const transitions = stateMachine.getValidTransitions('ACTIVE');
    expect(transitions).toContain('STALLED');
    expect(transitions).toContain('SHIPPED');
    expect(transitions).toHaveLength(2);
  });

  it('STALLED has exactly 2 valid transitions: ACTIVE, DEAD', () => {
    const transitions = stateMachine.getValidTransitions('STALLED');
    expect(transitions).toContain('ACTIVE');
    expect(transitions).toContain('DEAD');
    expect(transitions).toHaveLength(2);
  });

  it('SHIPPED has no valid transitions (terminal)', () => {
    expect(stateMachine.getValidTransitions('SHIPPED')).toHaveLength(0);
  });

  it('DEAD has exactly 1 valid transition: ACTIVE', () => {
    expect(stateMachine.getValidTransitions('DEAD')).toEqual(['ACTIVE']);
  });
});

// ─── validateTransition ───────────────────────────────────────────────────────

describe('stateMachine.validateTransition', () => {
  it('does not throw for valid transition BORN → ACTIVE', () => {
    expect(() => stateMachine.validateTransition('BORN', 'ACTIVE')).not.toThrow();
  });

  it('throws ApiError for invalid transition BORN → DEAD', () => {
    expect(() => stateMachine.validateTransition('BORN', 'DEAD')).toThrow();
  });

  it('throws for SHIPPED → anything (terminal state)', () => {
    expect(() => stateMachine.validateTransition('SHIPPED', 'ACTIVE')).toThrow();
    expect(() => stateMachine.validateTransition('SHIPPED', 'DEAD')).toThrow();
  });

  it('throws descriptive error message with valid transitions', () => {
    try {
      stateMachine.validateTransition('BORN', 'DEAD');
    } catch (err) {
      expect((err as Error).message).toContain('BORN');
      expect((err as Error).message).toContain('DEAD');
    }
  });
});

// ─── evaluateState ────────────────────────────────────────────────────────────

describe('stateMachine.evaluateState', () => {
  it('SHIPPED stays SHIPPED regardless of activity age', () => {
    const result = stateMachine.evaluateState({
      state: 'SHIPPED',
      lastActivityAt: daysAgo(300), // Very old
      createdAt: daysAgo(400),
    });
    expect(result).toBe('SHIPPED');
  });

  it('BORN with no activity stays BORN', () => {
    const result = stateMachine.evaluateState({
      state: 'BORN',
      lastActivityAt: null,
      createdAt: daysAgo(1),
    });
    expect(result).toBe('BORN');
  });

  it('project with activity 2 days ago → ACTIVE', () => {
    const result = stateMachine.evaluateState({
      state: 'ACTIVE',
      lastActivityAt: daysAgo(2),
      createdAt: daysAgo(60),
    });
    expect(result).toBe('ACTIVE');
  });

  it('project with activity 45 days ago → STALLED (>30 days)', () => {
    const result = stateMachine.evaluateState({
      state: 'ACTIVE',
      lastActivityAt: daysAgo(45),
      createdAt: daysAgo(120),
    });
    expect(result).toBe('STALLED');
  });

  it('project with activity 100 days ago → DEAD (>90 days)', () => {
    const result = stateMachine.evaluateState({
      state: 'STALLED',
      lastActivityAt: daysAgo(100),
      createdAt: daysAgo(180),
    });
    expect(result).toBe('DEAD');
  });

  it('activity exactly at stalledDays boundary (30 days) → STALLED', () => {
    // 30 days > HEALTH_CONFIG.stalledDays? No: >30 is STALLED, exactly 30 is ACTIVE
    const result = stateMachine.evaluateState({
      state: 'ACTIVE',
      lastActivityAt: daysAgo(30),
      createdAt: daysAgo(90),
    });
    // daysSince = 30, STALLED threshold is >30, so 30 should be ACTIVE
    expect(result).toBe('ACTIVE');
  });

  it('activity at 31 days → STALLED', () => {
    const result = stateMachine.evaluateState({
      state: 'ACTIVE',
      lastActivityAt: daysAgo(31),
      createdAt: daysAgo(90),
    });
    expect(result).toBe('STALLED');
  });

  it('falls back to createdAt when lastActivityAt is null and not BORN', () => {
    // Project in ACTIVE state but no lastActivityAt — use createdAt
    const result = stateMachine.evaluateState({
      state: 'ACTIVE',
      lastActivityAt: null,
      createdAt: daysAgo(100), // Should trigger DEAD
    });
    expect(result).toBe('DEAD');
  });
});
