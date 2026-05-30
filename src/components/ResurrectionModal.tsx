'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Dialog } from '@/components/ui/Dialog';
import { Button } from '@/components/ui/Button';
import { useResurrectProject } from '@/hooks/use-resurrect-project';
import { cn } from '@/lib/utils';

interface ResurrectionModalProps {
  open: boolean;
  onClose: () => void;
  deadProject: {
    id: string;
    title: string;
    stack: string[];
    lineageDepth: number;
  };
}

/**
 * Modal for resurrecting a dead project.
 * Logic lives in useResurrectProject — this component is pure JSX.
 */
export function ResurrectionModal({ open, onClose, deadProject }: ResurrectionModalProps) {
  const [successSlug, setSuccessSlug] = useState<string | null>(null);

  const { form, fieldErrors, serverError, isPending, setField, submit } =
    useResurrectProject(deadProject.id, deadProject.stack, (slug) => {
      setSuccessSlug(slug);
    });

  const handleClose = () => {
    if (!isPending) {
      onClose();
      setSuccessSlug(null);
    }
  };

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      title={successSlug ? 'Project Resurrected' : `Resurrect "${deadProject.title}"`}
      description={successSlug ? undefined : 'Give this project a second life. A new project will be created with lineage.'}
    >
      {/* Success state */}
      {successSlug ? (
        <div className="flex flex-col items-center gap-5 py-4 text-center">
          <div className="font-mono text-4xl" style={{ color: 'var(--health-thriving)' }}>↑</div>
          <div>
            <p className="font-mono text-[12px] font-semibold text-foreground">
              The project lives again.
            </p>
            <p className="mt-1 font-mono text-[10px] text-muted-foreground">
              A new chapter has been written in the lineage.
            </p>
          </div>
          <div className="flex gap-3">
            <Button variant="ghost" size="sm" onClick={handleClose}>
              Close
            </Button>
            <Link href={`/project/${successSlug}`}>
              <Button variant="primary" size="sm">
                View New Project →
              </Button>
            </Link>
          </div>
        </div>
      ) : (
        /* Form state */
        <div className="flex flex-col gap-4">
          {/* Repo URL — required */}
          <div className="flex flex-col gap-1.5">
            <label className="font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
              New GitHub Repo URL
            </label>
            <input
              type="url"
              value={form.repoUrl}
              onChange={(e) => setField('repoUrl', e.target.value)}
              placeholder="https://github.com/you/new-repo"
              className={cn(
                'w-full rounded-sm border bg-foreground/5 px-3 py-2 font-mono text-[12px] text-foreground outline-none placeholder:text-muted-foreground/40 transition-colors',
                fieldErrors.repoUrl
                  ? 'border-destructive/50 focus:border-destructive'
                  : 'border-foreground/12 focus:border-foreground/30'
              )}
            />
            {fieldErrors.repoUrl && (
              <p className="font-mono text-[10px] text-destructive">{fieldErrors.repoUrl}</p>
            )}
          </div>

          {/* Description override — optional */}
          <div className="flex flex-col gap-1.5">
            <label className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
              Updated Description
              <span className="text-muted-foreground/40">(optional)</span>
            </label>
            <textarea
              value={form.description}
              onChange={(e) => setField('description', e.target.value)}
              placeholder="What's different this time?"
              rows={2}
              className="w-full rounded-sm border border-foreground/12 bg-foreground/5 px-3 py-2 font-mono text-[12px] text-foreground outline-none placeholder:text-muted-foreground/40 transition-colors focus:border-foreground/30"
              maxLength={500}
            />
          </div>

          {/* Lineage note */}
          <p className="rounded-sm border border-accent/20 bg-accent/5 px-3 py-2 font-mono text-[10px] text-muted-foreground">
            This will create a new project linked to{' '}
            <span className="text-foreground">{deadProject.title}</span>{' '}
            with lineage depth {deadProject.lineageDepth + 1}.
          </p>

          {serverError && (
            <p className="font-mono text-[10px] text-destructive">{serverError}</p>
          )}

          <div className="flex items-center justify-end gap-3 border-t border-foreground/10 pt-4">
            <Button variant="ghost" size="sm" onClick={handleClose} disabled={isPending}>
              Cancel
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={submit}
              isLoading={isPending}
              disabled={!form.repoUrl}
              style={{ color: 'var(--health-thriving)', borderColor: 'var(--health-thriving)' } as React.CSSProperties}
              className="border bg-transparent hover:bg-emerald-500/10"
            >
              ↑ Resurrect
            </Button>
          </div>
        </div>
      )}
    </Dialog>
  );
}
