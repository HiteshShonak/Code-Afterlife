'use client';

import { useEffect } from 'react';
import { Button } from '@/components/ui/Button';

/**
 * Global error boundary — shown when an unhandled error reaches root.
 * Cinematic tombstone aesthetic matching the product identity.
 *
 * Next.js 16: reset prop is renamed to unstable_retry.
 * Function name must be Error (default export from error.tsx).
 */
export default function Error({
  error,
  unstable_retry,
}: {
  error: Error & { digest?: string };
  unstable_retry: () => void;
}) {
  useEffect(() => {
    // Log to monitoring in production
    console.error('[GlobalError]', error);
  }, [error]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 bg-background px-6 text-center">
      <div className="font-mono text-5xl text-muted-foreground/30">†</div>

      <div className="space-y-2">
        <h1 className="font-mono text-lg font-semibold uppercase tracking-[0.14em] text-foreground">
          Something died
        </h1>
        <p className="font-mono text-[11px] text-muted-foreground">
          An unexpected error occurred. The void consumed this page.
        </p>
        {error.digest && (
          <p className="font-mono text-[9px] text-muted-foreground/40">
            Error ID: {error.digest}
          </p>
        )}
      </div>

      <div className="flex gap-3">
        <Button variant="ghost" size="sm" onClick={() => { window.location.href = '/'; }}>
          Return Home
        </Button>
        <Button variant="outline" size="sm" onClick={unstable_retry}>
          Try Again
        </Button>
      </div>
    </div>
  );
}
