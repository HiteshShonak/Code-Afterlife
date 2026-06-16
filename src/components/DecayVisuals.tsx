'use client';

import { memo } from 'react';
import { motion } from 'framer-motion';
import { decayVariants } from '@/animations/decay';
import type { DecayState } from '@/types/health';

interface DecayVisualsProps {
  decayState: DecayState;
  children: React.ReactNode;
  // animation duration
  duration?: number;
  className?: string;
}

// decay visuals
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
