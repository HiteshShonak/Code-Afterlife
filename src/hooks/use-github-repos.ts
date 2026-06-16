'use client';

import { useState, useCallback, useRef } from 'react';

export interface GithubRepoItem {
  id: number;
  name: string;
  full_name: string;
  html_url: string;
  description: string | null;
  language: string | null;
  stars: number;
  updatedAt: string;
  isPrivate: boolean;
}

export type RepoErrorType = 'reauth_needed' | 'no_token' | 'network' | 'unknown';

interface UseGithubReposReturn {
  repos: GithubRepoItem[];
  loading: boolean;
  error: string | null;
  errorType: RepoErrorType | null;
  // load repos
}

// get gh repos
export function useGithubRepos(): UseGithubReposReturn {
  const [repos, setRepos] = useState<GithubRepoItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [errorType, setErrorType] = useState<RepoErrorType | null>(null);
  const hasFetched = useRef(false);

  const load = useCallback(async () => {
    if (hasFetched.current || loading) return;
    hasFetched.current = true;
    setLoading(true);
    setError(null);
    setErrorType(null);

    try {
      const res = await fetch('/api/github/repos');
      const json = await res.json();

      if (!res.ok) {
        const code = json.message as string;
        if (code === 'reauth_needed' || code === 'no_token') {
          setError('Your GitHub session needs to be refreshed to access repositories.');
          setErrorType('reauth_needed');
        } else {
          setError('Could not load your GitHub repositories.');
          setErrorType('unknown');
        }
        return;
      }

      setRepos(json.data ?? []);
    } catch {
      setError('Network error — could not reach the server.');
      setErrorType('network');
    } finally {
      setLoading(false);
    }
  }, [loading]);

  return { repos, loading, error, errorType, load };
}
