'use client';

import { useState, useTransition } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Rocket, ExternalLink, Pencil, X, Check, Loader2 } from 'lucide-react';

interface LiveAppSectionProps {
  projectId: string;
  initialUrl: string | null;
  isOwner: boolean;
}

const CARD_CLASS = 'group flex w-full items-center justify-between rounded-xl border transition-colors p-4 sm:p-5';

export function LiveAppSection({ projectId, initialUrl, isOwner }: LiveAppSectionProps) {
  const [url, setUrl]         = useState(initialUrl || '');
  const [editing, setEditing] = useState(false);
  const [draft, setDraft]     = useState('');
  const [error, setError]     = useState('');
  const [isPending, start]    = useTransition();

  // visitors see nothing when url is empty
  if (!isOwner && !url) return null;

  const openEdit = () => { setDraft(url); setError(''); setEditing(true); };
  const cancelEdit = () => { setEditing(false); setError(''); };

  const save = () => {
    const trimmed = draft.trim();
    if (trimmed && !/^https?:\/\/.+/.test(trimmed)) {
      setError('Must start with https://');
      return;
    }
    start(async () => {
      try {
        const res = await fetch(`/api/projects/${projectId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ deployedUrl: trimmed || null }),
        });
        if (!res.ok) throw new Error();
        setUrl(trimmed);
        setEditing(false);
        setError('');
      } catch {
        setError('Could not save. Try again.');
      }
    });
  };

  const displayUrl = url.replace(/^https?:\/\//, '').replace(/\/$/, '');

  return (
    <motion.div layout className="mb-8" transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}>
      <AnimatePresence mode="wait" initial={false}>

        {/* ── EDIT MODE ────────────────────────────────────────────── */}
        {editing && (
          <motion.div
            key="editing"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 6 }}
            className="w-full rounded-xl border border-emerald-500/30 bg-emerald-500/5 p-4 sm:p-5"
          >
            <div className="flex flex-col gap-4">
              <div className="flex items-center gap-2">
                <Rocket className="h-4 w-4 text-emerald-500/70 shrink-0" />
                <span className="font-mono text-[11px] uppercase tracking-widest text-emerald-500/70">
                  Live App URL
                </span>
              </div>
              <input
                type="url"
                value={draft}
                onChange={(e) => { setDraft(e.target.value); setError(''); }}
                placeholder="https://myapp.vercel.app"
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === 'Enter') save();
                  if (e.key === 'Escape') cancelEdit();
                }}
                className="w-full rounded-lg border border-border/50 bg-background/50 px-4 py-2.5 font-mono text-[12px] sm:text-[13px] text-foreground outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/20 transition-all"
              />
              <div className="flex items-center justify-end gap-2">
                <button
                  onClick={cancelEdit}
                  disabled={isPending}
                  className="rounded px-2.5 py-1.5 font-mono text-[10px] uppercase text-muted-foreground hover:text-foreground disabled:opacity-40"
                >
                  Cancel
                </button>
                <button
                  onClick={save}
                  disabled={isPending}
                  className="flex items-center gap-1.5 rounded bg-emerald-500/20 px-3 py-1.5 font-mono text-[10px] uppercase text-emerald-400 hover:bg-emerald-500/30 disabled:opacity-40"
                >
                  {isPending ? <Loader2 className="h-3 w-3 animate-spin" /> : <Check className="h-3 w-3" />}
                  Save
                </button>
              </div>
            </div>
            {error && (
              <p className="mt-2 font-mono text-[10px] text-destructive">{error}</p>
            )}
          </motion.div>
        )}

        {/* ── FILLED STATE ─────────────────────────────────────────── */}
        {!editing && url && (
          <motion.div
            key="filled"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 6 }}
          >
            <a
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              className={`${CARD_CLASS} border-foreground/10 bg-card/40 hover:bg-emerald-500/5 hover:border-emerald-500/30`}
            >
              <div className="flex min-w-0 items-center gap-4 sm:gap-5">
                {/* Subtle Orb */}
                <div className="hidden sm:flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-emerald-500/20 bg-emerald-500/10 text-emerald-400/80 transition-all group-hover:scale-105 group-hover:border-emerald-500/40 group-hover:text-emerald-400">
                  <Rocket className="h-4 w-4 transition-transform group-hover:-translate-y-0.5" />
                </div>
                
                <div className="flex flex-col min-w-0 gap-1.5">
                  <div className="flex items-center gap-2">
                    <span className="relative flex h-2 w-2 shrink-0">
                      <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-60" style={{ animationDuration: '2s' }} />
                      <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
                    </span>
                    <span className="font-mono text-[10px] sm:text-[11px] uppercase tracking-[0.2em] text-emerald-500/80 group-hover:text-emerald-400 transition-colors">
                      Live App
                    </span>
                  </div>
                  <span className="min-w-0 truncate font-mono text-[13px] sm:text-[14px] font-medium text-foreground/80 group-hover:text-foreground transition-colors">
                    {displayUrl}
                  </span>
                </div>
              </div>
              <div className="flex shrink-0 items-center justify-center h-8 w-8 rounded-full bg-foreground/5 group-hover:bg-emerald-500/10 transition-colors ml-4">
                <ExternalLink className="h-4 w-4 text-muted-foreground/50 group-hover:text-emerald-500/80 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all" />
              </div>
            </a>
            
            {isOwner && (
              <div className="mt-2.5 flex justify-end">
                <button
                  onClick={openEdit}
                  className="flex items-center gap-1.5 rounded-md bg-secondary/40 px-2.5 py-1.5 font-mono text-[10px] sm:text-[11px] uppercase tracking-wider text-muted-foreground hover:bg-secondary/80 hover:text-foreground transition-all"
                >
                  <Pencil className="h-3 w-3" />
                  Edit URL
                </button>
              </div>
            )}
          </motion.div>
        )}

        {/* ── EMPTY STATE (Owner only) ────────────────────────────── */}
        {!editing && !url && isOwner && (
          <motion.div
            key="empty"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 6 }}
          >
            <button
              onClick={openEdit}
              className={`${CARD_CLASS} border-dashed border-foreground/10 bg-transparent hover:border-emerald-500/30 hover:bg-emerald-500/5`}
            >
              <div className="flex items-center gap-4 sm:gap-5">
                <div className="hidden sm:flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-dashed border-foreground/20 text-muted-foreground/30 transition-all group-hover:border-emerald-500/40 group-hover:text-emerald-500/60">
                  <Rocket className="h-4 w-4 transition-transform group-hover:-translate-y-0.5" />
                </div>
                <div className="flex flex-col text-left min-w-0 gap-1">
                  <span className="font-mono text-[10px] sm:text-[11px] uppercase tracking-[0.2em] text-muted-foreground/50 group-hover:text-emerald-500/70 transition-colors">
                    Live App
                  </span>
                  <span className="font-mono text-[12px] sm:text-[13px] text-muted-foreground/40 group-hover:text-emerald-500/60 transition-colors">
                    + Add deployed link
                  </span>
                </div>
              </div>
            </button>
          </motion.div>
        )}

      </AnimatePresence>
    </motion.div>
  );
}

