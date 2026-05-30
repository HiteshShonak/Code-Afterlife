'use client';

import { memo } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { X, Plus, Hash } from 'lucide-react';
import { POPULAR_STACKS } from '@/config/project';
import { useStackPicker } from '@/hooks/use-stack-picker';
import { cn } from '@/lib/utils';

interface StackPickerProps {
  selected:  string[];
  onChange:  (stacks: string[]) => void;
  error?:    string;
}

/**
 * Smart stack picker component.
 * Shows 12 popular stacks by default.
 * As user types, filters all 60+ stacks and shows up to 8 suggestions.
 * Enter to pick top suggestion or add custom. Backspace removes last chip.
 */
export const StackPicker = memo(function StackPicker({ selected, onChange, error }: StackPickerProps) {
  const {
    query, setQuery, inputRef,
    suggestions, canAddCustom,
    add, remove, toggle,
    handleKeyDown, reachedMax, MAX_STACK,
  } = useStackPicker({ selected, onChange });

  return (
    <div className="flex flex-col gap-3">
      {/* Label */}
      <div className="flex items-center justify-between">
        <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
          Tech Stack
        </span>
        <span className={cn(
          'font-mono text-[10px]',
          selected.length >= MAX_STACK ? 'text-accent' : 'text-muted-foreground/50'
        )}>
          {selected.length}/{MAX_STACK}
        </span>
      </div>

      {/* Selected chips */}
      {selected.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          <AnimatePresence>
            {selected.map((tech) => (
              <motion.button
                key={tech}
                type="button"
                onClick={() => remove(tech)}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                transition={{ duration: 0.15 }}
                className="flex items-center gap-1 rounded-full border border-accent/50 bg-accent/10 px-2.5 py-1 font-mono text-[10px] text-accent transition-colors hover:border-destructive/50 hover:bg-destructive/10 hover:text-destructive"
              >
                {tech} <X className="h-2.5 w-2.5" />
              </motion.button>
            ))}
          </AnimatePresence>
        </div>
      )}

      {/* Search input */}
      {!reachedMax && (
        <div className="relative">
          <Hash className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground/50" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Search or add custom stack..."
            className="h-9 w-full rounded-md border border-border bg-secondary/50 pl-9 pr-4 font-mono text-[11px] text-foreground outline-none transition-colors placeholder:text-muted-foreground/40 focus:border-accent/60 focus:ring-1 focus:ring-accent"
          />

          {/* Suggestions dropdown */}
          <AnimatePresence>
            {(suggestions.length > 0 || canAddCustom) && (
              <motion.div
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                transition={{ duration: 0.12 }}
                className="absolute left-0 right-0 top-10 z-50 overflow-hidden rounded-md border border-border bg-card shadow-xl shadow-black/30"
              >
                {suggestions.map((tech) => (
                  <button
                    key={tech}
                    type="button"
                    onMouseDown={(e) => { e.preventDefault(); add(tech); }}
                    className="flex w-full items-center gap-2 px-3 py-2 font-mono text-[11px] text-foreground transition-colors hover:bg-secondary"
                  >
                    <Hash className="h-3 w-3 text-muted-foreground/40" />
                    {tech}
                  </button>
                ))}
                {canAddCustom && (
                  <button
                    type="button"
                    onMouseDown={(e) => { e.preventDefault(); add(query.trim()); }}
                    className="flex w-full items-center gap-2 border-t border-border px-3 py-2 font-mono text-[11px] text-accent transition-colors hover:bg-accent/10"
                  >
                    <Plus className="h-3 w-3" />
                    Add &quot;{query.trim()}&quot; as custom
                  </button>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}

      {/* Popular stacks (shown when no query) */}
      {!query.trim() && !reachedMax && (
        <div>
          <p className="mb-1.5 font-mono text-[9px] uppercase tracking-widest text-muted-foreground/40">
            Popular
          </p>
          <div className="flex flex-wrap gap-1.5">
            {POPULAR_STACKS.map((tech) => {
              const isSelected = selected.includes(tech);
              return (
                <button
                  key={tech}
                  type="button"
                  onClick={() => toggle(tech)}
                  className={cn(
                    'rounded-full border px-2.5 py-1 font-mono text-[9px] uppercase tracking-wider transition-all',
                    isSelected
                      ? 'border-accent/50 bg-accent/10 text-accent'
                      : 'border-border text-muted-foreground hover:border-foreground/30 hover:text-foreground'
                  )}
                >
                  {tech}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {error && <p className="font-mono text-[10px] text-destructive">{error}</p>}
    </div>
  );
});
