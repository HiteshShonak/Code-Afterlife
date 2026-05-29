'use client';

import { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';

interface DialogProps {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: React.ReactNode;
  className?: string;
}

const backdropVariants = {
  hidden:  { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.2 } },
  exit:    { opacity: 0, transition: { duration: 0.18 } },
};

const panelVariants = {
  hidden:  { opacity: 0, scale: 0.96, y: 12 },
  visible: { opacity: 1, scale: 1, y: 0, transition: { duration: 0.28, ease: [0.16, 1, 0.3, 1] } },
  exit:    { opacity: 0, scale: 0.96, y: 8,  transition: { duration: 0.18 } },
};

/**
 * Cinematic modal dialog with backdrop blur and Framer Motion enter/exit.
 * Locks body scroll while open. Closes on Escape key and backdrop click.
 */
export function Dialog({ open, onClose, title, description, children, className }: DialogProps) {
  // Lock body scroll
  useEffect(() => {
    if (open) document.body.style.overflow = 'hidden';
    else document.body.style.overflow = '';
    return () => { document.body.style.overflow = ''; };
  }, [open]);

  // Escape key
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [onClose]);

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <motion.div
            variants={backdropVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="absolute inset-0 bg-background/80 backdrop-blur-md"
            onClick={onClose}
            aria-hidden="true"
          />

          {/* Panel */}
          <motion.div
            variants={panelVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            role="dialog"
            aria-modal="true"
            aria-labelledby="dialog-title"
            className={cn(
              'relative z-10 w-full max-w-lg overflow-hidden rounded-sm border border-foreground/12 bg-card/95 shadow-2xl backdrop-blur-xl',
              className
            )}
          >
            {/* Header */}
            <div className="border-b border-foreground/10 px-6 py-5">
              <h2
                id="dialog-title"
                className="font-mono text-[13px] font-semibold uppercase tracking-[0.14em] text-foreground"
              >
                {title}
              </h2>
              {description && (
                <p className="mt-1 text-[11px] text-muted-foreground">{description}</p>
              )}
            </div>

            {/* Content */}
            <div className="px-6 py-5">{children}</div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
