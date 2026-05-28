'use client';

import { useState, useCallback, useTransition, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { createProjectAction } from '@/actions/project.actions';
import { AVAILABLE_STACKS, POPULAR_STACKS } from '@/config/project';
import type { ActionResult } from '@/lib/async-handler';
import type { Project } from '@prisma/client';

export { AVAILABLE_STACKS, POPULAR_STACKS };

const MAX_SCREENSHOTS = 5;
const MAX_STACK       = 15;

interface FormState {
  title:       string;
  description: string;
  repoUrl:     string;
  stack:       string[];
}

const INITIAL: FormState = {
  title:       '',
  description: '',
  repoUrl:     '',
  stack:       [],
};

/**
 * Encapsulates create-project form state and submission logic.
 * Screenshots are managed externally by the ImageUploader component
 * and passed in via screenshotUrls at submit time.
 * Orphan cleanup is called if the server action fails after upload.
 */
export function useCreateProject(onSuccess: () => void) {
  const router  = useRouter();
  const [form, setForm]               = useState<FormState>(INITIAL);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [serverError, setServerError] = useState<string | null>(null);
  const [isPending, startTransition]  = useTransition();

  // Ref to hold the orphan cleanup function from ImageUploader
  const cleanupRef = useRef<(() => Promise<void>) | null>(null);

  const setField = useCallback(
    <K extends keyof FormState>(key: K, value: FormState[K]) => {
      setForm((prev) => ({ ...prev, [key]: value }));
      setFieldErrors((prev) => {
        const next = { ...prev };
        delete next[key];
        return next;
      });
    },
    []
  );

  /**
   * Register the cleanup function from ImageUploader.
   * Called if project creation fails after images are uploaded.
   */
  const registerCleanup = useCallback((fn: () => Promise<void>) => {
    cleanupRef.current = fn;
  }, []);

  /**
   * Submit the form. screenshotUrls comes from ImageUploader's current state.
   */
  const submit = useCallback((screenshotUrls: string[]) => {
    setServerError(null);

    const data = new FormData();
    data.set('title',       form.title);
    data.set('description', form.description);
    data.set('repoUrl',     form.repoUrl);
    form.stack.forEach((s) => data.append('stack', s));
    screenshotUrls.forEach((url) => data.append('screenshots', url));

    startTransition(async () => {
      const result: ActionResult<Project> = await createProjectAction(data);

      if (result.success) {
        setForm(INITIAL);
        onSuccess();
        router.push(`/project/${result.data.slug}`);
        router.refresh();
      } else {
        // Project creation failed — delete uploaded images (orphan cleanup)
        if (screenshotUrls.length > 0 && cleanupRef.current) {
          await cleanupRef.current();
        }

        if (result.errors) {
          const mapped: Record<string, string> = {};
          Object.entries(result.errors).forEach(([k, v]) => { mapped[k] = v[0]; });
          setFieldErrors(mapped);
        }
        setServerError(result.message);
      }
    });
  }, [form, onSuccess, router]);

  const reset = useCallback(() => {
    setForm(INITIAL);
    setFieldErrors({});
    setServerError(null);
    cleanupRef.current = null;
  }, []);

  return {
    form,
    fieldErrors,
    serverError,
    isPending,
    setField,
    submit,
    reset,
    registerCleanup,
    MAX_SCREENSHOTS,
    MAX_STACK,
  };
}
