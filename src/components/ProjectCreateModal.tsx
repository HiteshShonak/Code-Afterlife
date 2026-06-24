'use client';

import { useState, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X, ChevronRight, ChevronLeft, Loader2,
  GitFork, Star, Lock, Globe, Search, CheckCircle2,
} from 'lucide-react';
import { StackPicker } from '@/components/StackPicker';
import { ImageUploader } from '@/components/ImageUploader';
import { useCreateProject } from '@/hooks/use-create-project';
import { useGithubRepos, type GithubRepoItem } from '@/hooks/use-github-repos';
import { signOut } from 'next-auth/react';
import { cn } from '@/lib/utils';

interface ProjectCreateModalProps {
  open: boolean;
  onClose: () => void;
}

// steps config

const STEPS = ['Images', 'Repository', 'Details', 'Stack'] as const;
type Step = typeof STEPS[number];

const slideVariants = {
  enter: (dir: number) => ({ x: dir > 0 ? 44 : -44, opacity: 0 }),
  center: { x: 0, opacity: 1 },
  exit: (dir: number) => ({ x: dir > 0 ? -44 : 44, opacity: 0 }),
};

// repo card
function RepoCard({
  repo,
  selected,
  onSelect,
}: {
  repo: GithubRepoItem;
  selected: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      onClick={onSelect}
      className={cn(
        'w-full text-left rounded-xl border px-3.5 py-3 transition-all duration-150',
        selected
          ? 'border-accent/60 bg-accent/8 ring-1 ring-accent/30'
          : 'border-border/50 bg-secondary/20 hover:border-border hover:bg-secondary/40',
      )}
    >
      <div className="flex items-start gap-2.5">
        <div className="mt-0.5 shrink-0">
          {selected ? (
            <CheckCircle2 className="h-4 w-4 text-accent" />
          ) : (
            <div className="h-4 w-4 rounded-full border-2 border-border/60" />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="font-mono text-[12px] font-semibold text-foreground truncate">
              {repo.name}
            </span>
            {repo.isPrivate ? (
              <span className="flex items-center gap-0.5 rounded-sm border border-amber-800/40 bg-amber-950/30 px-1.5 py-0.5 font-mono text-[9px] text-amber-400/70">
                <Lock className="h-2.5 w-2.5" /> Private
              </span>
            ) : (
              <span className="flex items-center gap-0.5 rounded-sm border border-border/30 bg-secondary/30 px-1.5 py-0.5 font-mono text-[9px] text-muted-foreground/50">
                <Globe className="h-2.5 w-2.5" /> Public
              </span>
            )}
            {repo.language && (
              <span className="rounded-sm border border-border/30 bg-secondary/30 px-1.5 py-0.5 font-mono text-[9px] text-muted-foreground/50">
                {repo.language}
              </span>
            )}
          </div>
          {repo.description && (
            <p className="mt-0.5 font-mono text-[10px] text-muted-foreground/60 line-clamp-1">
              {repo.description}
            </p>
          )}
        </div>
        {repo.stars > 0 && (
          <div className="flex items-center gap-0.5 shrink-0 text-muted-foreground/40">
            <Star className="h-3 w-3" />
            <span className="font-mono text-[9px]">{repo.stars}</span>
          </div>
        )}
      </div>
    </button>
  );
}

// main modal
export function ProjectCreateModal({ open, onClose }: ProjectCreateModalProps) {
  const [stepIndex, setStepIndex] = useState(0);
  const [direction, setDirection] = useState(1);
  const [screenshots, setScreenshots] = useState<string[]>([]);
  const [selectedRepo, setSelectedRepo] = useState<GithubRepoItem | null>(null);
  const [repoQuery, setRepoQuery] = useState('');

  const { repos, loading: reposLoading, error: reposError, errorType: reposErrorType, load: loadRepos } = useGithubRepos();

  const {
    form, fieldErrors, serverError, isPending,
    setField, submit, reset, MAX_SCREENSHOTS,
  } = useCreateProject(() => { onClose(); resetAll(); });

  const resetAll = useCallback(() => {
    reset();
    setStepIndex(0);
    setDirection(1);
    setScreenshots([]);
    setSelectedRepo(null);
    setRepoQuery('');
  }, [reset]);

  const handleClose = () => { if (!isPending) { onClose(); resetAll(); } };

  const navigate = (dir: 1 | -1) => {
    setDirection(dir);
    setStepIndex((i) => Math.max(0, Math.min(STEPS.length - 1, i + dir)));
  };

  // trigger lazy fetch
  const currentStep: Step = STEPS[stepIndex];
  useEffect(() => {
    if (currentStep === 'Repository') loadRepos();
  }, [currentStep, loadRepos]);

  // auto fill fields
  const handleRepoSelect = useCallback((repo: GithubRepoItem) => {
    if (selectedRepo?.id === repo.id) {
      // Deselect
      setSelectedRepo(null);
      setField('repoUrl', '');
      setField('title', '');
      setField('description', '');
      return;
    }
    setSelectedRepo(repo);
    setField('repoUrl', repo.html_url);
    if (!form.title || form.title === selectedRepo?.name) {
      setField('title', repo.name);
    }
    if (!form.description || form.description === selectedRepo?.description) {
      setField('description', repo.description ?? '');
    }
  }, [selectedRepo, form.title, form.description, setField]);

  // step validation
  const canAdvance = (): boolean => {
    if (currentStep === 'Images')      return screenshots.length >= 1;
    if (currentStep === 'Repository')  return true;
    if (currentStep === 'Details') {
      const hasTitle = form.title.trim().length >= 3;
      // url required check
      const hasUrl   = selectedRepo !== null || form.repoUrl.trim().length > 0;
      return hasTitle && hasUrl;
    }
    return true;
  };

  const isLastStep = stepIndex === STEPS.length - 1;

  const handleSubmit = () => {
    if (form.stack.length === 0) return;
    submit(screenshots);
  };

  // filtered repos
  const filteredRepos = repoQuery.trim()
    ? repos.filter(
        (r) =>
          r.name.toLowerCase().includes(repoQuery.toLowerCase()) ||
          (r.description ?? '').toLowerCase().includes(repoQuery.toLowerCase()),
      )
    : repos;

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-100 flex items-center justify-center p-4"
      onClick={(e) => { if (e.target === e.currentTarget) handleClose(); }}
    >
      {/* backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
      />

      {/* modal */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 16 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 16 }}
        transition={{ type: 'spring', damping: 28, stiffness: 320 }}
        className="relative z-10 flex w-full max-w-xl flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-2xl shadow-black/60"
        style={{ maxHeight: '92vh' }}
      >
        {/* header */}
        <div className="flex items-center justify-between border-b border-border px-6 py-4 shrink-0">
          <div>
            <h2 className="font-mono text-[14px] font-bold text-foreground">Register Project</h2>
            <p className="font-mono text-[10px] text-muted-foreground">
              Step {stepIndex + 1} of {STEPS.length} - {currentStep}
            </p>
          </div>

          {/* step indicators */}
          <div className="flex items-center gap-2">
            {STEPS.map((s, i) => (
              <div
                key={s}
                className={cn(
                  'h-1.5 rounded-full transition-all duration-300',
                  i < stepIndex ? 'w-6 bg-accent' :
                  i === stepIndex ? 'w-8 bg-accent' : 'w-6 bg-muted',
                )}
              />
            ))}
            <button
              onClick={handleClose}
              disabled={isPending}
              className="ml-3 flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground disabled:opacity-50"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* step content */}
        <div
          className="flex-1 overflow-y-auto px-6 py-5"
          style={{ minHeight: '340px' }}
        >
          <AnimatePresence mode="wait" custom={direction}>
            <motion.div
              key={currentStep}
              custom={direction}
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.2, ease: [0.32, 0.72, 0, 1] }}
            >

              {/* step 1 images */}
              {currentStep === 'Images' && (
                <div className="flex flex-col gap-4">
                  <div className="rounded-xl border border-accent/20 bg-accent/5 px-4 py-3 font-mono text-[11px] text-muted-foreground">
                    📸 Add at least <span className="font-bold text-foreground">1 screenshot</span> of your project. The first image becomes the cover. Up to {MAX_SCREENSHOTS} images total.
                  </div>
                  <ImageUploader
                    required
                    maxImages={MAX_SCREENSHOTS}
                    onChange={setScreenshots}
                    error={fieldErrors.screenshots}
                  />
                </div>
              )}

              {/* step 2 repository picker */}
              {currentStep === 'Repository' && (
                <div className="flex flex-col gap-4">
                  <div className="rounded-xl border border-border bg-secondary/30 px-4 py-3">
                    <div className="flex items-center gap-2 mb-1">
                      <GitFork className="h-4 w-4 text-muted-foreground/60" />
                      <span className="font-mono text-[11px] font-semibold text-foreground">Select a GitHub repository</span>
                    </div>
                    <p className="font-mono text-[10px] text-muted-foreground/60">
                      Choosing a repo auto-fills the URL, title, and description.
                      You can also skip this and enter a URL manually in the next step.
                    </p>
                  </div>

                  {/* search box */}
                  {repos.length > 0 && (
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground/40 pointer-events-none" />
                      <input
                        type="text"
                        value={repoQuery}
                        onChange={(e) => setRepoQuery(e.target.value)}
                        placeholder="Search repositories…"
                        className="w-full rounded-lg border border-border bg-secondary/40 py-2 pl-9 pr-4 font-mono text-[11px] text-foreground outline-none placeholder:text-muted-foreground/30 focus:border-accent/50"
                      />
                    </div>
                  )}

                  {/* loading */}
                  {reposLoading && (
                    <div className="flex flex-col items-center justify-center gap-3 py-10">
                      <Loader2 className="h-6 w-6 animate-spin text-muted-foreground/40" />
                      <p className="font-mono text-[10px] text-muted-foreground/40">Fetching your repositories…</p>
                    </div>
                  )}

                  {/* error cases */}
                  {reposError && !reposLoading && (
                    reposErrorType === 'reauth_needed' ? (
                      <div className="rounded-xl border border-amber-800/40 bg-amber-950/30 px-4 py-4 flex flex-col gap-3">
                        <div>
                          <p className="font-mono text-[11px] font-semibold text-amber-300">Repository access needs refresh</p>
                          <p className="mt-1 font-mono text-[10px] text-amber-400/70 leading-relaxed">
                            Your GitHub login was made before repo access was enabled.
                            Sign out and sign back in - it takes 5 seconds.
                          </p>
                        </div>
                        <div className="flex items-center gap-3">
                          <button
                            onClick={() => signOut({ callbackUrl: '/' })}
                            className="rounded-lg border border-amber-700/50 bg-amber-900/40 px-3 py-1.5 font-mono text-[10px] font-semibold text-amber-300 hover:bg-amber-800/50 transition-colors"
                          >
                            Sign out to refresh →
                          </button>
                          <button
                            onClick={() => navigate(1)}
                            className="font-mono text-[10px] text-muted-foreground/50 underline underline-offset-2 hover:text-muted-foreground"
                          >
                            Skip for now
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3">
                        <p className="font-mono text-[11px] text-destructive">{reposError}</p>
                        <p className="mt-1 font-mono text-[10px] text-muted-foreground/50">
                          You can skip this step and enter the URL manually.
                        </p>
                      </div>
                    )
                  )}

                  {/* repo list */}
                  {!reposLoading && !reposError && filteredRepos.length > 0 && (
                    <div className="flex flex-col gap-2">
                      {filteredRepos.map((repo) => (
                        <RepoCard
                          key={repo.id}
                          repo={repo}
                          selected={selectedRepo?.id === repo.id}
                          onSelect={() => handleRepoSelect(repo)}
                        />
                      ))}
                    </div>
                  )}

                  {/* empty search */}
                  {!reposLoading && !reposError && repos.length > 0 && filteredRepos.length === 0 && (
                    <div className="flex flex-col items-center gap-2 py-8">
                      <p className="font-mono text-[11px] text-muted-foreground/50">
                        No repositories match "{repoQuery}"
                      </p>
                    </div>
                  )}

                  {/* no repos */}
                  {!reposLoading && !reposError && repos.length === 0 && (
                    <div className="flex flex-col items-center gap-2 py-8">
                      <GitFork className="h-8 w-8 text-muted-foreground/20" />
                      <p className="font-mono text-[11px] text-muted-foreground/40">No public repositories found.</p>
                    </div>
                  )}
                </div>
              )}

              {/* step 3 details */}
              {currentStep === 'Details' && (
                <div className="flex flex-col gap-4">
                  {/* selected repo */}
                  {selectedRepo && (
                    <div className="flex items-center gap-2 rounded-xl border border-accent/20 bg-accent/5 px-4 py-2.5">
                      <GitFork className="h-3.5 w-3.5 text-accent/60 shrink-0" />
                      <span className="font-mono text-[11px] text-accent/80 truncate">
                        {selectedRepo.full_name}
                      </span>
                      <button
                        onClick={() => {
                          setSelectedRepo(null);
                          setField('repoUrl', '');
                        }}
                        className="ml-auto shrink-0 text-muted-foreground/40 hover:text-foreground/60"
                        title="Remove selected repo"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  )}

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

                  <Field
                    label="GitHub Repo URL"
                    error={fieldErrors.repoUrl}
                    optional={selectedRepo !== null}
                    hint={selectedRepo ? 'Auto-filled from selected repository' : undefined}
                  >
                    <input
                      id="create-repo-url"
                      type="url"
                      value={form.repoUrl}
                      onChange={(e) => setField('repoUrl', e.target.value)}
                      placeholder="https://github.com/you/repo"
                      className={cn(inputClass(!!fieldErrors.repoUrl), selectedRepo && 'text-muted-foreground/60')}
                      readOnly={!!selectedRepo}
                    />
                    {selectedRepo && (
                      <button
                        onClick={() => setSelectedRepo(null)}
                        className="font-mono text-[9px] text-muted-foreground/40 underline hover:text-muted-foreground"
                      >
                        Clear to enter manually
                      </button>
                    )}
                  </Field>
                </div>
              )}

              {/* step 4 stack */}
              {currentStep === 'Stack' && (
                <div className="flex flex-col gap-4">
                  <div className="rounded-xl border border-border bg-secondary/30 px-4 py-3 font-mono text-[11px] text-muted-foreground">
                    🛠 Select the technologies used in this project. Search for any stack or add a custom one.
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

        {/* server error */}
        {serverError && (
          <div className="mx-6 mb-2 shrink-0 rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-2.5 font-mono text-[11px] text-destructive">
            {serverError}
          </div>
        )}

        {/* footer */}
        <div className="flex items-center justify-between border-t border-border px-6 py-4 shrink-0">
          <button
            onClick={() => navigate(-1)}
            disabled={stepIndex === 0 || isPending}
            className="flex items-center gap-1.5 rounded-lg border border-border px-4 py-2 font-mono text-[11px] text-muted-foreground transition-colors hover:text-foreground disabled:pointer-events-none disabled:opacity-30"
          >
            <ChevronLeft className="h-3.5 w-3.5" /> Back
          </button>

          <div className="flex items-center gap-3">
            {/* skip button */}
            {currentStep === 'Repository' && (
              <button
                onClick={() => navigate(1)}
                className="font-mono text-[10px] text-muted-foreground/50 underline underline-offset-2 hover:text-muted-foreground transition-colors"
              >
                Skip - enter URL manually
              </button>
            )}

            {!isLastStep ? (
              <button
                onClick={() => navigate(1)}
                disabled={!canAdvance() || isPending}
                className="flex items-center gap-1.5 rounded-lg bg-accent px-5 py-2 font-mono text-[11px] font-bold text-background transition-all hover:opacity-90 disabled:pointer-events-none disabled:opacity-40"
              >
                {currentStep === 'Repository' && selectedRepo
                  ? <>Use {selectedRepo.name} <ChevronRight className="h-3.5 w-3.5" /></>
                  : <>Next <ChevronRight className="h-3.5 w-3.5" /></>
                }
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

// field wrapper
function Field({
  label, error, optional, hint, children,
}: {
  label: string; error?: string; optional?: boolean; hint?: string; children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
        {label}
        {optional && <span className="text-muted-foreground/40">(optional)</span>}
        {!optional && <span className="text-accent">*</span>}
        {hint && <span className="normal-case tracking-normal text-muted-foreground/40">{hint}</span>}
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
