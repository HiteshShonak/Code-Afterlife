'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Loader2, GitFork, ArrowRight, GitPullRequest, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { useResurrectProject } from '@/hooks/use-resurrect-project';
import { cn } from '@/lib/utils';

interface ForkSetupClientProps {
  deadProjectId: string;
  deadProjectTitle: string;
  deadProjectStack: string[];
  parentRepoUrl: string;
  testament: string | null;
}

export function ForkSetupClient({ deadProjectId, deadProjectTitle, deadProjectStack, parentRepoUrl, testament }: ForkSetupClientProps) {
  const router = useRouter();
  
  const [forkUrl, setForkUrl] = useState('');
  const [description, setDescription] = useState('');
  
  const [isForking, setIsForking] = useState(false);
  const [forkError, setForkError] = useState<string | null>(null);
  const [needsReauth, setNeedsReauth] = useState(false);

  // We only call the backend resurrection once we have the repo URL ready
  const { form, fieldErrors, serverError, isPending: isResurrecting, setField, submit } =
    useResurrectProject(deadProjectId, deadProjectStack, (newSlug) => {
      router.push(`/resurrect/${newSlug}/revealed`);
    });

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
        setForkUrl(data.url);
        // Automatically fill the resurrect form field
        setField('repoUrl', data.url);
      } else {
        setForkError(data.message);
        if (data.needsReauth) {
          setNeedsReauth(true);
        }
      }
    } catch (e) {
      setForkError('An unexpected error occurred while communicating with GitHub.');
    } finally {
      setIsForking(false);
    }
  };

  const handleManualSubmit = () => {
    setField('repoUrl', forkUrl);
    setField('description', description);
    // Use setTimeout to ensure state is updated before submit is called
    setTimeout(submit, 0);
  };

  return (
    <div className="flex flex-col gap-12">
      {/* The Will & Testament was removed from here to preserve the surprise for the Testament Revealed page */}

      <div className="flex flex-col md:flex-row gap-12">
        {/* ── Option A: Auto-Fork ── */}
      <div className="flex-1 rounded-2xl border border-border/50 bg-card/30 p-8 shadow-2xl backdrop-blur-sm relative overflow-hidden">
        {/* Subtle glow */}
        <div className="absolute inset-0 bg-emerald-500/5 pointer-events-none" />

        <div className="relative z-10 flex flex-col h-full">
          <div className="flex items-center gap-3 mb-6">
            <div className="h-10 w-10 rounded-full bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20 text-emerald-400">
              <GitPullRequest className="h-5 w-5" />
            </div>
            <div>
              <h2 className="font-mono text-[16px] font-bold text-foreground">1-Click Auto Fork</h2>
              <p className="font-mono text-[11px] text-muted-foreground/70">Requires public_repo permission</p>
            </div>
          </div>

          <p className="font-mono text-[12px] text-muted-foreground mb-8 leading-relaxed">
            We will call the GitHub API on your behalf to fork 
            <a href={parentRepoUrl} target="_blank" rel="noreferrer" className="text-accent hover:underline mx-1">
              {parentRepoUrl.split('github.com/')[1]}
            </a> 
            to your personal GitHub account.
          </p>

          {forkError && (
            <div className="mb-6 rounded-lg border border-red-500/20 bg-red-500/10 p-4 flex gap-3 items-start text-red-400">
              <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0" />
              <div>
                <p className="font-mono text-[11px] font-semibold">{forkError}</p>
                {needsReauth && (
                  <button onClick={() => window.location.href = '/'} className="mt-2 text-[10px] underline hover:text-red-300">
                    Sign out to grant permissions
                  </button>
                )}
              </div>
            </div>
          )}

          <div className="mt-auto">
            <Button
              variant="primary"
              onClick={handleAutoFork}
              isLoading={isForking}
              disabled={isForking || isResurrecting || !!forkUrl}
              className="w-full font-mono font-bold tracking-widest text-[12px] h-12"
              style={{ color: 'var(--health-thriving)', borderColor: 'var(--health-thriving)' } as React.CSSProperties}
            >
              <GitFork className="h-4 w-4 mr-2" />
              {forkUrl ? 'FORKED SUCCESSFULLY' : 'AUTO-FORK REPOSITORY'}
            </Button>
          </div>
        </div>
      </div>

      {/* ── Option B: Manual Setup ── */}
      <div className="flex-1 rounded-2xl border border-border/50 bg-card/30 p-8 shadow-2xl backdrop-blur-sm relative">
        <div className="flex items-center gap-3 mb-6">
          <div className="h-10 w-10 rounded-full bg-foreground/5 flex items-center justify-center border border-foreground/10 text-muted-foreground">
            <GitFork className="h-5 w-5" />
          </div>
          <div>
            <h2 className="font-mono text-[16px] font-bold text-foreground">Manual Setup</h2>
            <p className="font-mono text-[11px] text-muted-foreground/70">If you prefer doing it yourself</p>
          </div>
        </div>

        <div className="space-y-5">
          <div>
            <label className="font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground block mb-2">
              1. Fork the original code
            </label>
            <a 
              href={`${parentRepoUrl}/fork`} 
              target="_blank" 
              rel="noreferrer"
              className="inline-flex items-center gap-2 rounded-lg border border-border bg-background px-4 py-2 font-mono text-[11px] text-foreground hover:bg-foreground/5 transition-colors"
            >
              <ExternalLink className="h-3.5 w-3.5" />
              Open GitHub Fork Page
            </a>
          </div>

          <div>
            <label className="font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground block mb-2">
              2. Paste your new Fork URL
            </label>
            <input
              type="url"
              value={forkUrl}
              onChange={(e) => setForkUrl(e.target.value)}
              placeholder="https://github.com/you/new-repo"
              className={cn(
                'w-full rounded-lg border bg-background/50 px-3 py-2.5 font-mono text-[12px] text-foreground outline-none placeholder:text-muted-foreground/40 transition-colors',
                fieldErrors.repoUrl
                  ? 'border-destructive/50 focus:border-destructive focus:ring-1 focus:ring-destructive/20'
                  : 'border-border focus:border-accent/50 focus:ring-1 focus:ring-accent/20'
              )}
            />
            {fieldErrors.repoUrl && (
              <p className="mt-1 font-mono text-[10px] text-destructive">{fieldErrors.repoUrl}</p>
            )}
          </div>

          <div>
            <label className="font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground block mb-2 flex items-center gap-2">
              3. Updated Description
              <span className="text-muted-foreground/40 normal-case tracking-normal">(optional)</span>
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What is your vision for this second life?"
              rows={2}
              className="w-full rounded-lg border border-border bg-background/50 px-3 py-2.5 font-mono text-[12px] text-foreground outline-none placeholder:text-muted-foreground/40 transition-colors focus:border-accent/50 focus:ring-1 focus:ring-accent/20"
              maxLength={500}
            />
          </div>

          {serverError && (
            <div className="rounded-lg border border-red-500/20 bg-red-500/10 p-3 text-red-400">
              <p className="font-mono text-[11px]">{serverError}</p>
            </div>
          )}

          <div className="pt-4 border-t border-border/50">
            <Button
              variant="primary"
              onClick={handleManualSubmit}
              isLoading={isResurrecting}
              disabled={!forkUrl || isForking || isResurrecting}
              className="w-full h-12 bg-white text-black hover:bg-neutral-200 font-mono font-bold tracking-widest text-[12px]"
            >
              COMPLETE RESURRECTION <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          </div>
        </div>
      </div>
      </div>
    </div>
  );
}

// Ensure ExternalLink icon is imported
import { ExternalLink } from 'lucide-react';
