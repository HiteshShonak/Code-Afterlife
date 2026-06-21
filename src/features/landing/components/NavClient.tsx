'use client';

import Link from 'next/link';
import { SignInButton } from '@/components/auth/SignInButton';
import { UserMenu } from '@/components/shell/UserMenu';

const NAV_LINKS = [
  { label: 'How It Works', href: '#lifecycle',         section: 'lifecycle' },
  { label: 'Graveyard',    href: '#graveyard-preview', section: 'graveyard-preview' },
  { label: 'About',        href: '#capsule',           section: 'capsule' },
  { label: 'Legacy',       href: '#legacy',            section: 'legacy' },
];

interface NavClientProps {
  user: {
    id?: string;
    name?: string | null;
    username?: string | null;
    image?: string | null;
  } | null;
}

function scrollToSection(id: string) {
  const el = document.getElementById(id);
  if (!el) return;
  // Use Lenis if available (set on window by SmoothScroll provider)
  if (window.__lenis) {
    window.__lenis.scrollTo(el, { offset: 0, duration: 1.8 });
  } else {
    el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
}

function scrollToTop() {
  if (window.__lenis) {
    window.__lenis.scrollTo(0, { duration: 1.8 });
  } else {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
}

// nav client
export function NavClient({ user }: NavClientProps) {
  return (
    <nav className="fixed top-0 z-50 w-full mix-blend-difference pointer-events-none">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-6 md:px-10 pointer-events-auto">
        {/* logo */}
        <button
          onClick={scrollToTop}
          className="font-mono text-[11px] font-bold uppercase tracking-[0.18em] text-foreground"
        >
          Code Afterlife
        </button>

        {/* desktop nav */}
        <div className="hidden items-center gap-8 md:flex">
          {NAV_LINKS.map((link) => (
            <button
              key={link.label}
              onClick={() => scrollToSection(link.section)}
              className="font-mono text-[10px] uppercase tracking-[0.22em] text-muted-foreground transition-colors hover:text-foreground"
            >
              {link.label}
            </button>
          ))}

          <span className="h-3 w-px bg-foreground/30" />

          {/* explore */}
          <Link
            href="/explore"
            className="font-mono text-[10px] uppercase tracking-[0.22em] text-muted-foreground transition-colors hover:text-foreground"
          >
            Explore
          </Link>

          {/* profile link */}
          {user?.username && (
            <Link
              href={`/u/${user.username}`}
              className="font-mono text-[10px] uppercase tracking-[0.22em] text-muted-foreground transition-colors hover:text-foreground"
            >
              Profile
            </Link>
          )}

          {/* dashboard link */}
          {user && (
            <Link
              href="/dashboard"
              className="font-mono text-[10px] uppercase tracking-[0.22em] text-muted-foreground transition-colors hover:text-foreground"
            >
              Dashboard
            </Link>
          )}

          {/* auth control */}
          {user ? (
            <UserMenu name={user.name ?? null} username={user.username ?? null} image={user.image ?? null} />
          ) : (
            <SignInButton variant="nav" label="Sign In" />
          )}
        </div>
      </div>
    </nav>
  );
}
