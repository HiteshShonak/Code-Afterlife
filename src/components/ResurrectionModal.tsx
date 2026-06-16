'use client';

import Link from 'next/link';
import { Dialog } from '@/components/ui/Dialog';
import { Button } from '@/components/ui/Button';

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

// resurrection modal
export function ResurrectionModal({ open, onClose, deadProject }: ResurrectionModalProps) {
  return (
    <Dialog
      open={open}
      onClose={onClose}
      title={`Resurrect "${deadProject.title}"`}
      description="Give this project a second life. A new project will be created with lineage."
    >
      <div className="flex flex-col gap-4">
        <p className="font-mono text-[12px] text-muted-foreground/80 leading-relaxed mb-2">
          Resurrecting this project will require you to fork its repository and continue its legacy under your own name.
        </p>

        {/* lineage note */}
        <p className="rounded-sm border border-accent/20 bg-accent/5 px-3 py-2 font-mono text-[10px] text-muted-foreground">
          This will create a new project linked to{' '}
          <span className="text-foreground">{deadProject.title}</span>{' '}
          with lineage depth {deadProject.lineageDepth + 1}.
        </p>

        <div className="flex items-center justify-end gap-3 border-t border-foreground/10 pt-4 mt-2">
          <Button variant="ghost" size="sm" onClick={onClose}>
            Cancel
          </Button>
          <Link href={`/project/resurrect/${deadProject.id}`} onClick={onClose}>
            <Button
              variant="primary"
              size="sm"
              style={{ color: 'var(--health-thriving)', borderColor: 'var(--health-thriving)' } as React.CSSProperties}
              className="border bg-transparent hover:bg-emerald-500/10"
            >
              Begin Resurrection →
            </Button>
          </Link>
        </div>
      </div>
    </Dialog>
  );
}

