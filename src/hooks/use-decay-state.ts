'use client';

import { useMemo } from 'react';
import { getDecayState } from '@/lib/health-calculator';
import type { DecayState } from '@/types/health';

/**
 * Derives the decay state and health label from a numeric health score.
 * Memoized — only recalculates when `health` changes.
 */
export function useDecayState(health: number): {
  decayState: DecayState;
  healthLabel: string;
  healthPercent: number;
} {
  return useMemo(() => {
    const decayState = getDecayState(health);
    const healthPercent = Math.round(Math.min(100, Math.max(0, health)));

    const LABELS: Record<DecayState, string> = {
      thriving: 'Thriving',
      stable: 'Stable',
      unstable: 'Unstable',
      nearDeath: 'Near Death',
      dead: 'Dead',
    };

    return {
      decayState,
      healthLabel: LABELS[decayState],
      healthPercent,
    };
  }, [health]);
}
