'use client';

import { useEffect, useRef } from 'react';
import { useAnimationControls } from 'framer-motion';
import { ANIMATION_TIMING } from '@/config/animations';
import type { DecayState } from '@/types/health';

/**
 * Drives a looping pulse scale animation based on the project's decay state.
 * Thriving = fast pulse, Unstable = slow/weak pulse, Dead = no pulse.
 * Encapsulates animation logic so components stay lean.
 */
export function usePulseAnimation(decayState: DecayState) {
  const controls = useAnimationControls();
  const prevState = useRef<DecayState | null>(null);

  useEffect(() => {
    if (prevState.current === decayState) return;
    prevState.current = decayState;

    if (decayState === 'dead') {
      controls.stop();
      controls.set({ scale: 1 });
      return;
    }

    const duration = ANIMATION_TIMING.pulse[decayState as keyof typeof ANIMATION_TIMING.pulse];

    if (!duration) return;

    controls.start({
      scale: [1, decayState === 'thriving' ? 1.08 : decayState === 'stable' ? 1.04 : 1.02, 1],
      transition: {
        duration, // config stores seconds directly (Framer Motion convention)
        repeat: Infinity,
        ease: 'easeInOut',
      },
    });
  }, [decayState, controls]);

  return controls;
}
