'use client';

import { memo } from 'react';
import { motion } from 'framer-motion';
import { decayVariants } from '@/animations/decay';
import type { DecayState } from '@/types/health';

interface DecayVisualsProps {
  decayState: DecayState;
  children: React.ReactNode;
  /** Override the animation transition duration in seconds */
  duration?: number;
  className?: string;
}

/**
 * Wraps children in a Framer Motion container that applies decay-state visual filters.
 * thriving → saturated + bright
 * dead     → grayscale + faded + slight skew
 *
 * Per engineering-patterns rule: Framer Motion for ALL app animations.
 * The `decayVariants` come from animations/decay.ts (single source of truth).
 */
export const DecayVisuals = memo(function DecayVisuals({
  decayState,
  children,
  duration = 0.5,
  className,
}: DecayVisualsProps) {
  return (
    <motion.div
      variants={decayVariants}
      animate={decayState}
      initial={false}
      transition={{ duration, ease: [0.16, 1, 0.3, 1] }}
      className={className}
    >
      {children}
    </motion.div>
  );
});
