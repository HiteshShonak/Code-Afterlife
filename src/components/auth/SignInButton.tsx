'use client';

import { signIn } from 'next-auth/react';
import { motion } from 'framer-motion';

interface SignInButtonProps {
  /** Optional class overrides. Defaults to nav-style mono link. */
  className?: string;
  /** Label shown on the button. */
  label?: string;
  /** Visual variant — 'nav' for inline text link, 'cta' for accented button, 'sidebar' for full-width sidebar button */
  variant?: 'nav' | 'cta' | 'sidebar';
}

export function SignInButton({
  className,
  label = 'Sign In',
  variant = 'nav',
}: SignInButtonProps) {
  const handleSignIn = () => signIn('github', { callbackUrl: '/dashboard' });

  if (variant === 'cta') {
    return (
      <motion.button
        onClick={handleSignIn}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        className={
          className ??
          'inline-flex items-center gap-2 rounded-sm border border-foreground/20 bg-foreground/5 px-5 py-2.5 font-mono text-[11px] uppercase tracking-[0.18em] text-foreground backdrop-blur-sm transition-colors hover:border-foreground/40 hover:bg-foreground/10'
        }
      >
        <GitHubIcon />
        {label}
      </motion.button>
    );
  }

  if (variant === 'sidebar') {
    return (
      <button
        onClick={handleSignIn}
        className={className ?? 'flex w-full items-center justify-center gap-2 rounded-xl border border-accent/30 bg-accent/10 px-4 py-2.5 font-mono text-[11px] font-semibold uppercase tracking-[0.15em] text-accent transition-all hover:bg-accent/20 hover:border-accent/50'}
      >
        <GitHubIcon />
        {label}
      </button>
    );
  }

  // Default: nav variant — plain text link style
  return (
    <button
      onClick={handleSignIn}
      className={
        className ??
        'font-mono text-[10px] uppercase tracking-[0.22em] text-foreground transition-opacity hover:opacity-70'
      }
    >
      {label}
    </button>
  );
}

function GitHubIcon() {
  return (
    <svg
      width="13"
      height="13"
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
    >
      <path d="M12 0C5.374 0 0 5.373 0 12c0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23A11.509 11.509 0 0 1 12 5.803c1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576C20.566 21.797 24 17.3 24 12c0-6.627-5.373-12-12-12z" />
    </svg>
  );
}
