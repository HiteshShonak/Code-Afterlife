import Link from 'next/link';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: '404 — Code Afterlife',
  description: 'This page was abandoned.',
};

/**
 * 404 Not Found — cinematic tombstone aesthetic.
 */
export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 bg-background px-6 text-center">
      <div className="font-mono text-6xl text-muted-foreground/20">†</div>

      <div className="space-y-2">
        <p className="font-mono text-[10px] uppercase tracking-[0.24em] text-muted-foreground/60">
          404
        </p>
        <h1 className="font-mono text-xl font-semibold tracking-tight text-foreground">
          This page died.
        </h1>
        <p className="font-mono text-[11px] text-muted-foreground">
          It was abandoned, archived, or never existed at all.
        </p>
      </div>

      <div className="flex gap-4">
        <Link
          href="/"
          className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground transition-colors hover:text-foreground"
        >
          Return to surface
        </Link>
        <Link
          href="/graveyard"
          className="font-mono text-[10px] uppercase tracking-[0.18em] text-foreground transition-opacity hover:opacity-70"
        >
          Visit the Graveyard →
        </Link>
      </div>
    </div>
  );
}
