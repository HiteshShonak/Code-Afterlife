'use client';

import { useState, useCallback, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { resurrectProjectAction } from '@/actions/resurrection.actions';
import type { ActionResult } from '@/lib/async-handler';
import type { Project } from '@prisma/client';

interface ResurrectFormState {
  repoUrl: string;
  description: string;
  stack: string[];
}

// resurrect project hook
export function useResurrectProject(
  deadProjectId: string,
  deadProjectStack: string[],
  onSuccess: (newSlug: string) => void
) {
  const router = useRouter();
  const [form, setForm] = useState<ResurrectFormState>({
    repoUrl: '',
    description: '',
    stack: deadProjectStack,
  });
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [serverError, setServerError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const setField = useCallback(<K extends keyof ResurrectFormState>(key: K, value: ResurrectFormState[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    setFieldErrors((prev) => { const n = { ...prev }; delete n[key]; return n; });
  }, []);

  const submit = useCallback(() => {
    setServerError(null);
    const data = new FormData();
    data.set('repoUrl', form.repoUrl);
    data.set('description', form.description);
    form.stack.forEach((s) => data.append('stack', s));

    startTransition(async () => {
      const result: ActionResult<Project> = await resurrectProjectAction(deadProjectId, data);

      if (result.success) {
        onSuccess(result.data.slug);
        router.refresh();
      } else {
        if (result.errors) {
          const mapped: Record<string, string> = {};
          Object.entries(result.errors).forEach(([k, v]) => { mapped[k] = v[0]; });
          setFieldErrors(mapped);
        }
        setServerError(result.message);
      }
    });
  }, [form, deadProjectId, onSuccess, router]);

  return { form, fieldErrors, serverError, isPending, setField, submit };
}
