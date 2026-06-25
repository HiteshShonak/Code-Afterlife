'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  AlertTriangle,
  ArrowRight,
  ChevronLeft,
  ExternalLink,
  GitFork,
  GitPullRequest,
  Loader2,
  ShieldAlert,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { ImageUploader } from '@/components/ImageUploader';
import { StackPicker } from '@/components/StackPicker';
import { useResurrectProject } from '@/hooks/use-resurrect-project';
import { cn } from '@/lib/utils';

interface ForkSetupClientProps {
  deadProjectId: string;
  deadProjectTitle: string;
  deadProjectDescription: string | null;
  deadProjectStack: string[];
  deadProjectScreenshots: string[];
  parentRepoUrl: string;
  testament: string | null;
}

type Step = 'fork' | 'testament' | 'details';

const STEPS: { id: Step; label: string }[] = [
  { id: 'fork', label: 'Fork' },
  { id: 'testament', label: 'Testament' },
  { id: 'details', label: 'Project Post' },
];

export function ForkSetupClient({
  deadProjectId,
  deadProjectTitle,
  deadProjectDescription,
  deadProjectStack,
  deadProjectScreenshots,
  parentRepoUrl,
  testament,
}: ForkSetupClientProps) {
  const router = useRouter();
  const [step, setStep] = useState<Step>('fork');
  const [isForking, setIsForking] = useState(false);
  const [forkError, setForkError] = useState<string | null>(null);
  const [needsReauth, setNeedsReauth] = useState(false);

  const {
    form,
    fieldErrors,
    serverError,
    isPending: isResurrecting,
    setField,
    submit,
  } = useResurrectProject(
    deadProjectId,
    {
      title: `${deadProjectTitle} (Resurrected)`,
      repoUrl: '',
      description: deadProjectDescription ?? '',
      screenshots: deadProjectScreenshots.slice(0, 5),
      stack: deadProjectStack,
    },
    (newSlug) => {
      router.push(`/project/${newSlug}`);
    },
  );

  const currentIndex = STEPS.findIndex((item) => item.id === step);
  const canContinueFork = form.repoUrl.trim().length > 0;
  const canSubmit =
    form.title.trim().length >= 3 &&
    form.screenshots.length >= 1 &&
    form.screenshots.length <= 5 &&
    form.stack.length >= 1 &&
    form.repoUrl.trim().length > 0;

  const handleAutoFork = async () => {
    setIsForking(true);
    setForkError(null);
    setNeedsReauth(false);

    try {
      const res = await fetch('/api/github/fork', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ parentRepoUrl }),
      });

      const data = await res.json();

      if (data.success) {
        setField('repoUrl', data.url);
      } else {
        setForkError(data.message);
        if (data.needsReauth) setNeedsReauth(true);
      }
    } catch {
      setForkError('An unexpected error occurred while communicating with GitHub.');
    } finally {
      setIsForking(false);
    }
  };

  return (
    <div className="flex flex-col gap-8">
      <div className="flex items-center gap-2">
        {STEPS.map((item, index) => (
          <div key={item.id} className="flex min-w-0 flex-1 items-center gap-2">
            <div
              className={cn(
                'flex h-8 w-8 shrink-0 items-center justify-center rounded-full border font-mono text-[10px]',
                index <= currentIndex
                  ? 'border-accent/50 bg-accent/15 text-accent'
                  : 'border-border bg-card/40 text-muted-foreground/50',
              )}
            >
              {index + 1}
            </div>
            <span
              className={cn(
                'hidden truncate font-mono text-[10px] uppercase tracking-[0.18em] sm:block',
                index <= currentIndex ? 'text-foreground/70' : 'text-muted-foreground/35',
              )}
            >
              {item.label}
            </span>
            {index < STEPS.length - 1 && <div className="h-px flex-1 bg-border/60" />}
          </div>
        ))}
      </div>

      {step === 'fork' && (
        <div className="grid gap-6 md:grid-cols-2">
          <div className="relative overflow-hidden rounded-2xl border border-emerald-500/20 bg-card/30 p-6 shadow-2xl backdrop-blur-sm">
            <div className="absolute inset-0 bg-emerald-500/5 pointer-events-none" />
            <div className="relative z-10 flex h-full flex-col">
              <div className="mb-6 flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full border border-emerald-500/20 bg-emerald-500/10 text-emerald-400">
                  <GitPullRequest className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="font-mono text-[16px] font-bold text-foreground">1-Click Auto Fork</h2>
                  <p className="font-mono text-[11px] text-muted-foreground/70">Requires GitHub repo permission</p>
                </div>
              </div>

              <p className="mb-8 font-mono text-[12px] leading-relaxed text-muted-foreground">
                We will fork{' '}
                <a href={parentRepoUrl} target="_blank" rel="noreferrer" className="text-accent hover:underline">
                  {parentRepoUrl.split('github.com/')[1] ?? parentRepoUrl}
                </a>{' '}
                into your GitHub account.
              </p>

              {forkError && (
                <div className="mb-6 flex gap-3 rounded-lg border border-red-500/20 bg-red-500/10 p-4 text-red-400">
                  <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                  <div>
                    <p className="font-mono text-[11px] font-semibold">{forkError}</p>
                    {needsReauth && (
                      <button
                        onClick={() => {
                          window.location.href = '/';
                        }}
                        className="mt-2 text-[10px] underline hover:text-red-300"
                      >
                        Sign out to grant permissions
                      </button>
                    )}
                  </div>
                </div>
              )}

              <Button
                variant="outline"
                onClick={handleAutoFork}
                isLoading={isForking}
                disabled={isForking || isResurrecting}
                className="mt-auto h-12 w-full border-emerald-500/50 text-[12px] font-bold text-emerald-400 hover:border-emerald-400 hover:bg-emerald-500/10 hover:text-emerald-300"
              >
                <GitFork className="mr-2 h-4 w-4" />
                {form.repoUrl ? 'Fork URL Ready' : 'Auto-Fork Repository'}
              </Button>
            </div>
          </div>

          <div className="rounded-2xl border border-border/50 bg-card/30 p-6 shadow-2xl backdrop-blur-sm">
            <div className="mb-6 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full border border-foreground/10 bg-foreground/5 text-muted-foreground">
                <GitFork className="h-5 w-5" />
              </div>
              <div>
                <h2 className="font-mono text-[16px] font-bold text-foreground">Manual Setup</h2>
                <p className="font-mono text-[11px] text-muted-foreground/70">If you prefer doing it yourself</p>
              </div>
            </div>

            <div className="space-y-5">
              <div>
                <label className="mb-2 block font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
                  1. Fork the original code
                </label>
                <a
                  href={`${parentRepoUrl}/fork`}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-2 rounded-lg border border-border bg-background px-4 py-2 font-mono text-[11px] text-foreground transition-colors hover:bg-foreground/5"
                >
                  <ExternalLink className="h-3.5 w-3.5" />
                  Open GitHub Fork Page
                </a>
              </div>

              <div>
                <label className="mb-2 block font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
                  2. Paste your new fork URL
                </label>
                <input
                  type="url"
                  value={form.repoUrl}
                  onChange={(event) => setField('repoUrl', event.target.value)}
                  placeholder="https://github.com/you/new-repo"
                  className={cn(
                    'w-full rounded-lg border bg-background/50 px-3 py-2.5 font-mono text-[12px] text-foreground outline-none placeholder:text-muted-foreground/40 transition-colors',
                    fieldErrors.repoUrl
                      ? 'border-destructive/50 focus:border-destructive focus:ring-1 focus:ring-destructive/20'
                      : 'border-border focus:border-accent/50 focus:ring-1 focus:ring-accent/20',
                  )}
                />
                {fieldErrors.repoUrl && (
                  <p className="mt-1 font-mono text-[10px] text-destructive">{fieldErrors.repoUrl}</p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {step === 'testament' && (
        <div className="mx-auto w-full max-w-3xl rounded-2xl border border-amber-500/15 bg-amber-500/[0.03] p-6 shadow-2xl">
          <div className="mb-5 flex items-center gap-3 text-amber-400/80">
            <ShieldAlert className="h-5 w-5" />
            <span className="font-mono text-[11px] uppercase tracking-[0.28em]">Will & Testament</span>
          </div>
          {testament ? (
            <p className="whitespace-pre-wrap text-lg italic leading-relaxed text-foreground/90">
              &ldquo;{testament}&rdquo;
            </p>
          ) : (
            <div className="space-y-4">
              <p className="font-mono text-sm italic text-muted-foreground/60">No testament was left behind.</p>
              <p className="text-base leading-relaxed text-foreground/80">
                The code is yours now. Keep what matters, discard what does not, and make the next life honest.
              </p>
            </div>
          )}
        </div>
      )}

      {step === 'details' && (
        <div className="mx-auto grid w-full max-w-4xl gap-6">
          <div className="rounded-2xl border border-border/50 bg-card/30 p-6 shadow-xl">
            <h2 className="mb-1 font-mono text-[16px] font-bold text-foreground">Shape the child project post</h2>
            <p className="mb-6 font-mono text-[11px] text-muted-foreground/70">
              Defaults are inherited from the original. Change the public title, description, screenshots, and stack before the new project is born.
            </p>

            <div className="space-y-5">
              <Field label="Project Title" error={fieldErrors.title}>
                <input
                  value={form.title}
                  onChange={(event) => setField('title', event.target.value)}
                  maxLength={100}
                  className={inputClass(Boolean(fieldErrors.title))}
                />
              </Field>

              <Field label="Description" error={fieldErrors.description} optional>
                <textarea
                  value={form.description}
                  onChange={(event) => setField('description', event.target.value)}
                  rows={4}
                  maxLength={500}
                  className={inputClass(Boolean(fieldErrors.description))}
                  placeholder="What is your vision for this second life?"
                />
                <p className="text-right font-mono text-[9px] text-muted-foreground/40">
                  {form.description.length}/500
                </p>
              </Field>

              <ImageUploader
                required
                maxImages={5}
                initialImages={deadProjectScreenshots.slice(0, 5)}
                onChange={(urls) => setField('screenshots', urls)}
                error={fieldErrors.screenshots}
              />

              <StackPicker
                selected={form.stack}
                onChange={(stack) => setField('stack', stack)}
                error={fieldErrors.stack}
              />

              {serverError && (
                <div className="rounded-lg border border-red-500/20 bg-red-500/10 p-3 text-red-400">
                  <p className="font-mono text-[11px]">{serverError}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <div className="flex items-center justify-between border-t border-border/50 pt-6">
        <Button
          variant="outline"
          onClick={() => {
            if (step === 'testament') setStep('fork');
            if (step === 'details') setStep('testament');
          }}
          disabled={step === 'fork' || isForking || isResurrecting}
        >
          <ChevronLeft className="h-3.5 w-3.5" />
          Back
        </Button>

        {step === 'fork' && (
          <Button
            onClick={() => setStep('testament')}
            disabled={!canContinueFork || isForking || isResurrecting}
          >
            Read Testament
            <ArrowRight className="h-3.5 w-3.5" />
          </Button>
        )}

        {step === 'testament' && (
          <Button onClick={() => setStep('details')} disabled={isResurrecting}>
            Continue
            <ArrowRight className="h-3.5 w-3.5" />
          </Button>
        )}

        {step === 'details' && (
          <Button onClick={submit} isLoading={isResurrecting} disabled={!canSubmit || isForking}>
            {isResurrecting ? (
              <>
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                Creating
              </>
            ) : (
              <>
                Complete Resurrection
                <ArrowRight className="h-3.5 w-3.5" />
              </>
            )}
          </Button>
        )}
      </div>
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
        {optional ? <span className="text-muted-foreground/40">(optional)</span> : <span className="text-accent">*</span>}
      </label>
      {children}
      {error && <p className="font-mono text-[10px] text-destructive">{error}</p>}
    </div>
  );
}

function inputClass(hasError: boolean) {
  return cn(
    'w-full rounded-lg border bg-background/50 px-4 py-2.5 font-mono text-[12px] text-foreground outline-none placeholder:text-muted-foreground/40 transition-colors',
    hasError
      ? 'border-destructive/50 focus:border-destructive'
      : 'border-border focus:border-accent/60 focus:ring-1 focus:ring-accent/20',
  );
}
