'use client';

import { memo } from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { useDecayState } from '@/hooks/use-decay-state';
import { usePulseAnimation } from '@/hooks/use-pulse-animation';

interface HealthIndicatorProps {
  health: number;
  /** Show numeric percentage label */
  showLabel?: boolean;
  /** Show the decay state text (Thriving / Stable / etc) */
  showStateLabel?: boolean;
  className?: string;
}

/** CSS variable name for each decay state health color */
const DECAY_COLOR: Record<string, string> = {
  thriving:  'var(--health-thriving)',
  stable:    'var(--health-stable)',
  unstable:  'var(--health-unstable)',
  nearDeath: 'var(--health-near-death)',
  dead:      'var(--health-dead)',
};

/**
 * Animated health bar with pulse dot.
 * Logic lives in useDecayState + usePulseAnimation hooks.
 * Component is pure presentation — logic-free JSX.
 */
export const HealthIndicator = memo(function HealthIndicator({
  health,
  showLabel = false,
  showStateLabel = true,
  className,
}: HealthIndicatorProps) {
  const { decayState, healthLabel, healthPercent } = useDecayState(health);
  const pulseControls = usePulseAnimation(decayState);
  const color = DECAY_COLOR[decayState];

  return (
    <div className={cn('flex flex-col gap-1.5', className)}>
      {/* Bar + pulse dot row */}
      <div className="flex items-center gap-2">
        {/* Pulse dot */}
        <motion.span
          animate={pulseControls}
          className="block h-2 w-2 flex-shrink-0 rounded-full"
          style={{ backgroundColor: color, boxShadow: `0 0 6px 1px ${color}` }}
        />

        {/* Progress bar track */}
        <div className="relative h-[3px] flex-1 overflow-hidden rounded-full bg-foreground/10">
          <motion.div
            className="absolute inset-y-0 left-0 rounded-full"
            style={{ backgroundColor: color }}
            initial={{ width: 0 }}
            animate={{ width: `${healthPercent}%` }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          />
        </div>

        {/* Numeric label */}
        {showLabel && (
          <span className="w-8 text-right font-mono text-[10px] text-muted-foreground">
            {healthPercent}
          </span>
        )}
      </div>

      {/* State text label */}
      {showStateLabel && (
        <span
          className="font-mono text-[9px] uppercase tracking-[0.16em]"
          style={{ color }}
        >
          {healthLabel}
        </span>
      )}
    </div>
  );
});
