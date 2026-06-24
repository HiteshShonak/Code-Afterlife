'use client';

import { memo } from 'react';
import { motion } from 'framer-motion';
import { formatDate } from '@/lib/utils';
import type { TimelineEntryType } from '@prisma/client';

// colors config
const TYPE_CONFIG: Record<
  TimelineEntryType,
  { label: string; color: string; icon: string }
> = {
  MILESTONE:    { label: 'Milestone',   color: 'oklch(0.72 0.18 295)',  icon: '◆' },
  DEATH:        { label: 'Death',       color: 'oklch(0.55 0.02 0)',    icon: '†' },
  RESURRECTION: { label: 'Resurrected', color: 'var(--health-thriving)', icon: '↑' },
  UPDATE:       { label: 'Update',      color: 'oklch(0.72 0.18 220)',  icon: '·' },
  AI_BUILD_LOG: { label: 'AI Log',      color: 'oklch(0.78 0.17 70)',   icon: '⚡' },
};

interface TimelineEntryProps {
  type: TimelineEntryType;
  title: string;
  description?: string | null;
  createdAt: Date;
  // stagger index
  index?: number;
}

const entryVariants = {
  hidden: { opacity: 0, x: -12 },
  visible: (i: number) => ({
    opacity: 1,
    x: 0,
    transition: { delay: i * 0.07, duration: 0.4, ease: [0.16, 1, 0.3, 1] },
  }),
};

// timeline event
export const TimelineEntry = memo(function TimelineEntry({
  type,
  title,
  description,
  createdAt,
  index = 0,
}: TimelineEntryProps) {
  const { label, color, icon } = TYPE_CONFIG[type];

  return (
    <motion.li
      variants={entryVariants}
      initial="hidden"
      animate="visible"
      custom={index}
      className="relative flex gap-4 pb-6 last:pb-0"
    >
      {/* timeline dot */}
      <div className="relative flex flex-col items-center">
        <span
          className="z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-foreground/10 bg-card font-mono text-sm shadow-sm"
          style={{ color }}
        >
          {icon}
        </span>
        <div className="mt-1 w-px flex-1 bg-foreground/8 last:hidden" />
      </div>

      {/* content */}
      <div className="flex-1 pt-0.5">
        <div className="flex items-center gap-2">
          <span
            className="font-mono text-xs uppercase tracking-[0.16em] font-medium"
            style={{ color }}
          >
            {label}
          </span>
          <span className="font-mono text-xs text-muted-foreground/60">
            {formatDate(createdAt)}
          </span>
        </div>
        <p className="mt-1 text-base font-semibold text-foreground/90">{title}</p>
        {description && (
          <p className="mt-1.5 text-[15px] leading-relaxed text-muted-foreground/90 font-sans">
            {description}
          </p>
        )}
      </div>
    </motion.li>
  );
});
