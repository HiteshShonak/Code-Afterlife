'use client';

import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ChevronRight, ChevronLeft, Loader2 } from 'lucide-react';
import { StackPicker } from '@/components/StackPicker';
import { ImageUploader } from '@/components/ImageUploader';
import { useCreateProject } from '@/hooks/use-create-project';
import { cn } from '@/lib/utils';

interface ProjectCreateModalProps {
  open:    boolean;
  onClose: () => void;
}

const STEPS = ['Images', 'Details', 'Stack'] as const;
type Step = typeof STEPS[number];

const slideVariants = {
  enter: (dir: number) => ({ x: dir > 0 ? 40 : -40, opacity: 0 }),
  center: { x: 0, opacity: 1 },
  exit:  (dir: number) => ({ x: dir > 0 ? -40 : 40, opacity: 0 }),
};

/**
 * Multi-step create project modal.
 * Step 1: Images (drag-drop Cloudinary upload, 1 required)
 * Step 2: Details (title, description, GitHub URL)
 * Step 3: Tech stack (smart picker)
 */
export function ProjectCreateModal({ open, onClose }: ProjectCreateModalProps) {
  const [stepIndex, setStepIndex]     = useState(0);
  const [direction, setDirection]     = useState(1);
  const [screenshots, setScreenshots] = useState<string[]>([]);

  const {
    form, fieldErrors, serverError, isPending,
    setField, submit, reset, MAX_SCREENSHOTS,
  } = useCreateProject(() => { onClose(); resetAll(); });

  const resetAll = useCallback(() => {
    reset();
    setStepIndex(0);
    setDirection(1);
    setScreenshots([]);
  }, [reset]);

  const handleClose = () => { if (!isPending) { onClose(); resetAll(); } };

  const navigate = (dir: 1 | -1) => {
    setDirection(dir);
    setStepIndex((i) => Math.max(0, Math.min(STEPS.length - 1, i + dir)));
  };

  const currentStep: Step = STEPS[stepIndex];

  // Validation per step (prevents advancing without required data)
  const canAdvance = () => {
    if (currentStep === 'Images') return screenshots.length >= 1;
    if (currentStep === 'Details') return form.title.trim().length >= 3 && form.repoUrl.trim().length > 0;
    return true;
  };

  const isLastStep = stepIndex === STEPS.length - 1;

  const handleSubmit = () => {
    if (form.stack.length === 0) return;
    submit(screenshots);
  };

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4"
      onClick={(e) => { if (e.target === e.currentTarget) handleClose(); }}
    >
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
      />

      {/* Modal */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 16 }}
        animate={{ opacity: 1, scale: 1,    y: 0   }}
        exit={{    opacity: 0, scale: 0.95, y: 16  }}
        transition={{ type: 'spring', damping: 28, stiffness: 320 }}
        className="relative z-10 flex w-full max-w-xl flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-2xl shadow-black/60"
        style={{ maxHeight: '90vh' }}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border px-6 py-4">
          <div>
            <h2 className="font-mono text-[14px] font-bold text-foreground">Register Project</h2>
            <p className="font-mono text-[10px] text-muted-foreground">
              Step {stepIndex + 1} of {STEPS.length} — {currentStep}
            </p>
          </div>

          {/* Step indicators */}
          <div className="flex items-center gap-2">
            {STEPS.map((s, i) => (
              <div
                key={s}
                className={cn(
                  'h-1.5 rounded-full transition-all duration-300',
                  i < stepIndex  ? 'w-6 bg-accent' :
                  i === stepIndex ? 'w-8 bg-accent' : 'w-6 bg-muted'
                )}
              />
            ))}
            <button
              onClick={handleClose}
              className="ml-3 flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Step content */}
        <div className="flex-1 overflow-y-auto px-6 py-5" style={{ minHeight: '320px' }}>
          <AnimatePresence mode="wait" custom={direction}>
            <motion.div
              key={currentStep}
              custom={direction}
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.22, ease: [0.32, 0.72, 0, 1] }}
            >
              {currentStep === 'Images' && (
                <div className="flex flex-col gap-4">
                  <div className="rounded-xl border border-accent/20 bg-accent/5 px-4 py-3 font-mono text-[11px] text-muted-foreground">
                    📸 Add at least <span className="text-foreground font-bold">1 screenshot</span> of your project.
                    The first image becomes the cover. Up to {MAX_SCREENSHOTS} images total.
                  </div>
                  <ImageUploader
                    required
                    maxImages={MAX_SCREENSHOTS}
                    onChange={setScreenshots}
                    error={fieldErrors.screenshots}
                  />
                </div>
              )}

              {currentStep === 'Details' && (
                <div className="flex flex-col gap-4">
                  <Field label="Project Title" error={fieldErrors.title}>
                    <input
                      id="create-title"
                      type="text"
                      value={form.title}
                      onChange={(e) => setField('title', e.target.value)}
                      placeholder="My Awesome Project"
                      className={inputClass(!!fieldErrors.title)}
                      maxLength={100}
                      autoFocus
                    />
                  </Field>

                  <Field label="Description" error={fieldErrors.description} optional>
                    <textarea
                      id="create-description"
                      value={form.description}
                      onChange={(e) => setField('description', e.target.value)}
                      placeholder="What is this project about? What problem does it solve?"
                      rows={3}
                      className={inputClass(!!fieldErrors.description)}
                      maxLength={500}
                    />
                    <p className="font-mono text-[9px] text-muted-foreground/40 text-right">
                      {form.description.length}/500
                    </p>
                  </Field>

                  <Field label="GitHub Repo URL" error={fieldErrors.repoUrl}>
                    <input
                      id="create-repo-url"
                      type="url"
                      value={form.repoUrl}
                      onChange={(e) => setField('repoUrl', e.target.value)}
                      placeholder="https://github.com/you/repo"
                      className={inputClass(!!fieldErrors.repoUrl)}
                    />
                  </Field>
                </div>
              )}

              {currentStep === 'Stack' && (
                <div className="flex flex-col gap-4">
                  <div className="rounded-xl border border-border bg-secondary/30 px-4 py-3 font-mono text-[11px] text-muted-foreground">
                    🛠 Select the technologies used in this project.
                    Search for any stack or add a custom one.
                  </div>
                  <StackPicker
                    selected={form.stack}
                    onChange={(stacks) => setField('stack', stacks)}
                    error={fieldErrors.stack}
                  />
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Server error */}
        {serverError && (
          <div className="mx-6 mb-2 rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-2.5 font-mono text-[11px] text-destructive">
            {serverError}
          </div>
        )}

        {/* Footer navigation */}
        <div className="flex items-center justify-between border-t border-border px-6 py-4">
          <button
            onClick={() => navigate(-1)}
            disabled={stepIndex === 0}
            className="flex items-center gap-1.5 rounded-lg border border-border px-4 py-2 font-mono text-[11px] text-muted-foreground transition-colors hover:text-foreground disabled:pointer-events-none disabled:opacity-30"
          >
            <ChevronLeft className="h-3.5 w-3.5" /> Back
          </button>

          <div className="flex items-center gap-2">
            {/* Skip images button (step 0 only) */}
            {stepIndex === 0 && screenshots.length === 0 && (
              <button
                onClick={() => navigate(1)}
                className="font-mono text-[10px] text-muted-foreground/50 underline underline-offset-2 hover:text-muted-foreground"
              >
                Skip for now
              </button>
            )}

            {!isLastStep ? (
              <button
                onClick={() => navigate(1)}
                disabled={!canAdvance()}
                className="flex items-center gap-1.5 rounded-lg bg-accent px-5 py-2 font-mono text-[11px] font-bold text-background transition-all hover:opacity-90 disabled:pointer-events-none disabled:opacity-40"
              >
                Next <ChevronRight className="h-3.5 w-3.5" />
              </button>
            ) : (
              <button
                onClick={handleSubmit}
                disabled={isPending || form.stack.length === 0}
                className="flex items-center gap-2 rounded-lg bg-accent px-6 py-2 font-mono text-[11px] font-bold text-background transition-all hover:opacity-90 disabled:pointer-events-none disabled:opacity-40"
              >
                {isPending ? (
                  <><Loader2 className="h-3.5 w-3.5 animate-spin" /> Creating…</>
                ) : (
                  <>Register Project</>
                )}
              </button>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
}

function Field({ label, error, optional, children }: {
  label: string; error?: string; optional?: boolean; children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
        {label}
        {optional && <span className="text-muted-foreground/40">(optional)</span>}
        {!optional && <span className="text-accent">*</span>}
      </label>
      {children}
      {error && <p className="font-mono text-[10px] text-destructive">{error}</p>}
    </div>
  );
}

function inputClass(hasError: boolean) {
  return cn(
    'w-full rounded-lg border bg-secondary/50 px-4 py-2.5 font-mono text-[12px] text-foreground outline-none placeholder:text-muted-foreground/40 transition-colors',
    hasError ? 'border-destructive/50 focus:border-destructive' : 'border-border focus:border-accent/60 focus:ring-1 focus:ring-accent/20'
  );
}
