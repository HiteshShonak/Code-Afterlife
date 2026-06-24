'use client';

import { useState, useTransition, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Skull, X, Sparkles } from 'lucide-react';
import { archiveProjectAction } from '@/actions/project.actions';

// fallback epitaphs

const EPITAPH_SUGGESTIONS = [
  'Lost to scope creep.',
  'The rewrite never came.',
  'Burned out before launch.',
  'Abandoned during finals.',
  'Dependencies rotted.',
  'The team moved on.',
  'One commit short of done.',
  'The market didn\'t agree.',
];

// props

interface ArchiveProjectModalProps {
  open: boolean;
  projectId: string;
  projectTitle: string;
  onClose: () => void;
  onArchived: () => void; // called after success (e.g. router.push('/dashboard'))
}

// component

export function ArchiveProjectModal({
  open,
  projectId,
  projectTitle,
  onClose,
  onArchived,
}: ArchiveProjectModalProps) {
  const [reason, setReason] = useState('');
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Pick a random suggestion to show as placeholder
  const placeholder = useRef(
    EPITAPH_SUGGESTIONS[Math.floor(Math.random() * EPITAPH_SUGGESTIONS.length)]
  );

  // Focus input when modal opens
  useEffect(() => {
    if (open) {
      const t = setTimeout(() => inputRef.current?.focus(), 150);
      return () => clearTimeout(t);
    }
  }, [open]);

  // Close on Escape
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [open, onClose]);

  const handleArchive = () => {
    setError(null);
    startTransition(async () => {
      const result = await archiveProjectAction(projectId, reason.trim());
      if (!result.success) {
        setError(result.message ?? 'Something went wrong.');
      } else {
        onArchived();
      }
    });
  };

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            key="archive-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-80 bg-black/70 backdrop-blur-md"
            onClick={onClose}
          />

          {/* Modal */}
          <motion.div
            key="archive-modal"
            initial={{ opacity: 0, scale: 0.94, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 10 }}
            transition={{ type: 'spring', damping: 28, stiffness: 320 }}
            className="fixed inset-0 z-81 flex items-center justify-center p-4"
          >
            <div
              className="relative w-full max-w-md overflow-hidden rounded-2xl border border-red-900/30 bg-[#0d0508] shadow-2xl shadow-red-950/40"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Subtle red radial glow */}
              <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(180,0,30,0.12)_0%,transparent_65%)]" />

              {/* Header */}
              <div className="relative flex items-start justify-between border-b border-red-900/20 px-6 py-5">
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-red-950/60 border border-red-900/30">
                    <Skull className="h-4 w-4 text-red-400/80" />
                  </div>
                  <div>
                    <p className="font-mono text-[10px] uppercase tracking-[0.25em] text-red-500/60">
                      Archive Project
                    </p>
                    <p className="mt-0.5 font-sans text-[15px] font-semibold text-foreground/90 leading-tight">
                      {projectTitle}
                    </p>
                  </div>
                </div>
                <button
                  onClick={onClose}
                  className="flex h-7 w-7 items-center justify-center rounded-lg text-muted-foreground/50 transition-colors hover:text-foreground"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              {/* Body */}
              <div className="relative px-6 py-5">
                <p className="mb-1 font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground/50">
                  Final words
                </p>
                <p className="mb-4 font-sans text-[13px] text-muted-foreground/60 leading-relaxed">
                  Leave a brief epitaph for this project. It will be engraved on the tombstone in the graveyard for all to see.
                </p>

                <textarea
                  ref={inputRef}
                  value={reason}
                  onChange={(e) => setReason(e.target.value.slice(0, 120))}
                  placeholder={placeholder.current}
                  rows={3}
                  className="w-full resize-none rounded-xl border border-white/8 bg-white/3 px-4 py-3 font-sans text-[13px] text-foreground/80 placeholder:text-muted-foreground/25 outline-none ring-0 transition-colors focus:border-red-800/50 focus:bg-white/5"
                />

                {/* Character count */}
                <div className="mt-1.5 flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-muted-foreground/30">
                    <Sparkles className="h-3 w-3" />
                    <span className="font-mono text-[10px]">
                      {reason.trim() ? 'Your words' : 'Skip to use a random epitaph'}
                    </span>
                  </div>
                  <span className="font-mono text-[10px] text-muted-foreground/30">
                    {reason.length}/120
                  </span>
                </div>

                {error && (
                  <p className="mt-3 font-mono text-[11px] text-red-400/80">{error}</p>
                )}
              </div>

              {/* Footer */}
              <div className="flex items-center justify-end gap-3 border-t border-red-900/20 px-6 py-4">
                <button
                  onClick={onClose}
                  disabled={isPending}
                  className="rounded-xl px-4 py-2.5 font-mono text-[11px] uppercase tracking-[0.18em] text-muted-foreground/60 transition-colors hover:text-foreground disabled:opacity-40"
                >
                  Cancel
                </button>
                <button
                  onClick={handleArchive}
                  disabled={isPending}
                  className="inline-flex items-center gap-2 rounded-xl border border-red-800/40 bg-red-950/50 px-5 py-2.5 font-mono text-[11px] uppercase tracking-[0.18em] text-red-300/90 transition-all hover:bg-red-900/40 hover:border-red-700/60 disabled:opacity-50"
                >
                  {isPending ? (
                    <>
                      <span className="h-3 w-3 animate-spin rounded-full border border-red-400/30 border-t-red-400" />
                      Archiving…
                    </>
                  ) : (
                    <>
                      <Skull className="h-3 w-3" />
                      Archive Forever
                    </>
                  )}
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
