'use client';

import { useCallback, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { X, Lock, Loader2, Save } from 'lucide-react';
import { updateProjectAction } from '@/actions/project.actions';
import { ImageUploader } from '@/components/ImageUploader';
import { cn } from '@/lib/utils';

interface ProjectEditModalProps {
  open: boolean;
  onClose: () => void;
  project: {
    id: string;
    title: string;
    description: string | null;
    githubRepoUrl: string;
    screenshots: string[];
  };
}

const MAX_SCREENSHOTS = 5;

export function ProjectEditModal({ open, onClose, project }: ProjectEditModalProps) {
  const router = useRouter();
  const [title, setTitle] = useState(project.title);
  const [description, setDescription] = useState(project.description ?? '');
  const [screenshots, setScreenshots] = useState<string[]>(project.screenshots);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [serverError, setServerError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const close = useCallback(() => {
    if (!isPending) onClose();
  }, [isPending, onClose]);

  const save = useCallback(() => {
    const nextErrors: Record<string, string> = {};
    if (title.trim().length < 3) nextErrors.title = 'Title must be at least 3 characters';
    if (screenshots.length < 1) nextErrors.screenshots = 'Keep at least 1 screenshot';
    if (screenshots.length > MAX_SCREENSHOTS) nextErrors.screenshots = `Maximum ${MAX_SCREENSHOTS} screenshots`;

    setFieldErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    const data = new FormData();
    data.set('title', title.trim());
    data.set('description', description.trim());
    screenshots.forEach((url) => data.append('screenshots', url));

    setServerError(null);
    startTransition(async () => {
      const result = await updateProjectAction(project.id, data);
      if (result.success) {
        router.refresh();
        onClose();
      } else {
        const mapped: Record<string, string> = {};
        if (result.errors) {
          Object.entries(result.errors).forEach(([key, messages]) => {
            mapped[key] = messages[0];
          });
        }
        setFieldErrors(mapped);
        setServerError(result.message);
      }
    });
  }, [description, onClose, project.id, router, screenshots, title]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-100 flex items-center justify-center p-4"
      onClick={(event) => {
        if (event.target === event.currentTarget) close();
      }}
    >
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
      />

      <motion.div
        initial={{ opacity: 0, y: 16, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 16, scale: 0.96 }}
        transition={{ type: 'spring', damping: 28, stiffness: 320 }}
        className="relative z-10 flex max-h-[92vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-2xl shadow-black/60"
      >
        <div className="flex shrink-0 items-center justify-between border-b border-border px-5 py-4 sm:px-6">
          <div>
            <h2 className="font-mono text-[14px] font-bold text-foreground">Edit Project</h2>
            <p className="font-mono text-[10px] text-muted-foreground">
              Update the project post without changing its GitHub source.
            </p>
          </div>
          <button
            onClick={close}
            disabled={isPending}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground disabled:opacity-50"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="flex-1 space-y-5 overflow-y-auto px-5 py-5 sm:px-6">
          <Field label="Project Title" error={fieldErrors.title}>
            <input
              value={title}
              onChange={(event) => {
                setTitle(event.target.value);
                setFieldErrors((prev) => ({ ...prev, title: '' }));
              }}
              maxLength={100}
              className={inputClass(Boolean(fieldErrors.title))}
            />
          </Field>

          <Field label="Description" error={fieldErrors.description} optional>
            <textarea
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              rows={4}
              maxLength={500}
              className={inputClass(Boolean(fieldErrors.description))}
            />
            <p className="text-right font-mono text-[9px] text-muted-foreground/40">
              {description.length}/500
            </p>
          </Field>

          <Field label="GitHub Repository" optional>
            <div className="flex items-center gap-2 rounded-lg border border-border bg-secondary/30 px-3 py-2.5">
              <Lock className="h-3.5 w-3.5 shrink-0 text-muted-foreground/50" />
              <span className="min-w-0 truncate font-mono text-[11px] text-muted-foreground">
                {project.githubRepoUrl}
              </span>
            </div>
          </Field>

          <ImageUploader
            required
            maxImages={MAX_SCREENSHOTS}
            initialImages={project.screenshots}
            onChange={(urls) => {
              setScreenshots(urls);
              setFieldErrors((prev) => ({ ...prev, screenshots: '' }));
            }}
            error={fieldErrors.screenshots}
          />

          {serverError && (
            <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-2.5 font-mono text-[11px] text-destructive">
              {serverError}
            </div>
          )}
        </div>

        <div className="flex shrink-0 items-center justify-between border-t border-border px-5 py-4 sm:px-6">
          <button
            onClick={close}
            disabled={isPending}
            className="rounded-lg border border-border px-4 py-2 font-mono text-[11px] text-muted-foreground transition-colors hover:text-foreground disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={save}
            disabled={isPending}
            className="inline-flex items-center gap-2 rounded-lg bg-accent px-5 py-2 font-mono text-[11px] font-bold text-background transition-opacity hover:opacity-90 disabled:opacity-50"
          >
            {isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
            Save Changes
          </button>
        </div>
      </motion.div>
    </div>
  );
}

function Field({
  label,
  error,
  optional,
  children,
}: {
  label: string;
  error?: string;
  optional?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
        {label}
        {optional ? (
          <span className="text-muted-foreground/40">(optional)</span>
        ) : (
          <span className="text-accent">*</span>
        )}
      </label>
      {children}
      {error && <p className="font-mono text-[10px] text-destructive">{error}</p>}
    </div>
  );
}

function inputClass(hasError: boolean) {
  return cn(
    'w-full rounded-lg border bg-secondary/50 px-4 py-2.5 font-mono text-[12px] text-foreground outline-none placeholder:text-muted-foreground/40 transition-colors',
    hasError
      ? 'border-destructive/50 focus:border-destructive'
      : 'border-border focus:border-accent/60 focus:ring-1 focus:ring-accent/20',
  );
}
