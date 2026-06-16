'use client';

import { useEffect, useRef } from 'react';
import { useAnimationControls } from 'framer-motion';
import { ANIMATION_TIMING } from '@/config/animations';
import type { DecayState } from '@/types/health';

// pulse anim hook
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
        duration, // in seconds
        repeat: Infinity,
        ease: 'easeInOut',
      },
    });
  }, [decayState, controls]);

  return controls;
}
