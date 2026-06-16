'use client';

import { useState, useCallback, useTransition } from 'react';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import type { SearchFilters } from '@/services/search.service';
import type { ProjectState } from '@prisma/client';

export type SearchSort = NonNullable<SearchFilters['sort']>;

interface UseSearchFiltersReturn {
  state:       ProjectState | undefined;
  stacks:      string[];
  search:      string;
  sort:        SearchSort;
  setState:    (s: ProjectState | undefined) => void;
  toggleStack: (stack: string) => void;
  setSearch:   (s: string) => void;
  setSort:     (s: SearchSort) => void;
  reset:       () => void;
}

// search filters hook
export function useSearchFilters(): UseSearchFiltersReturn {
  const router      = useRouter();
  const pathname    = usePathname();
  const searchParams = useSearchParams();

  const [, startTransition] = useTransition();

  const getParam  = (key: string) => searchParams.get(key) ?? '';
  const getParams = (key: string) => searchParams.getAll(key);

  const [state,  setStateLocal]  = useState<ProjectState | undefined>(
    (getParam('state') as ProjectState) || undefined
  );
  const [stacks, setStacksLocal] = useState<string[]>(getParams('stack'));
  const [search, setSearchLocal] = useState<string>(getParam('q'));
  const [sort,   setSortLocal]   = useState<SearchSort>(
    (getParam('sort') as SearchSort) || 'TRENDING'
  );

  const updateUrl = useCallback(
    (params: Record<string, string | string[] | undefined>) => {
      const sp = new URLSearchParams();
      Object.entries(params).forEach(([k, v]) => {
        if (!v || (Array.isArray(v) && v.length === 0)) return;
        if (Array.isArray(v)) v.forEach((val) => sp.append(k, val));
        else sp.set(k, v);
      });
      const query = sp.toString();
      const newUrl = `${pathname}${query ? `?${query}` : ''}`;
      window.history.replaceState({ ...window.history.state, as: newUrl, url: newUrl }, '', newUrl);
    },
    [pathname]
  );

  const setState = (s: ProjectState | undefined) => {
    setStateLocal(s);
    updateUrl({ state: s, stack: stacks, q: search, sort });
  };

  const toggleStack = (stack: string) => {
    const next = stacks.includes(stack)
      ? stacks.filter((s) => s !== stack)
      : [...stacks, stack];
    setStacksLocal(next);
    updateUrl({ state, stack: next, q: search, sort });
  };

  const setSearch = (s: string) => {
    setSearchLocal(s);
    updateUrl({ state, stack: stacks, q: s, sort });
  };

  const setSort = (s: SearchSort) => {
    setSortLocal(s);
    updateUrl({ state, stack: stacks, q: search, sort: s });
  };

  const reset = () => {
    setStateLocal(undefined);
    setStacksLocal([]);
    setSearchLocal('');
    setSortLocal('TRENDING');
    window.history.replaceState({ ...window.history.state, as: pathname, url: pathname }, '', pathname);
  };

  return { state, stacks, search, sort, setState, toggleStack, setSearch, setSort, reset };
}
