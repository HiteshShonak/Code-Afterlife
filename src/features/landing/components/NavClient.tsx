'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { signOut } from 'next-auth/react';
import { useRouter } from 'next/navigation';
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

export function NavClient({ user }: NavClientProps) {
  const [isOpen, setIsOpen] = useState(false);
  const router = useRouter();

  // Lock body scroll when mobile menu is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  const handleMobileNavClick = (sectionId?: string, isRoute?: boolean) => {
    setIsOpen(false);
    if (!isRoute && sectionId) {
      // Slight delay to let menu close animation start before heavy scroll
      setTimeout(() => scrollToSection(sectionId), 100);
    }
  };

  return (
    <>
      {/* Desktop & Mobile Header (Mix Blend) */}
      <nav className="fixed top-0 z-50 w-full mix-blend-difference pointer-events-none">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-6 md:px-10 pointer-events-auto">
          {/* logo */}
          <button
            onClick={() => {
              scrollToTop();
              setIsOpen(false);
            }}
            className="font-mono text-[11px] font-bold uppercase tracking-[0.18em] text-foreground transition-opacity hover:opacity-70"
          >
            Code Afterlife
          </button>

          {/* mobile hamburger button */}
          <button
            className="md:hidden p-2 -mr-2 text-foreground focus:outline-none"
            onClick={() => setIsOpen(true)}
            aria-label="Open menu"
          >
            {/* Sleek, wide hamburger icon matching design aesthetics */}
            <svg width="24" height="16" viewBox="0 0 24 16" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M0 1H24" stroke="currentColor" strokeWidth="1.5" />
              <path d="M0 8H24" stroke="currentColor" strokeWidth="1.5" />
              <path d="M0 15H24" stroke="currentColor" strokeWidth="1.5" />
            </svg>
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

            {/* auth control */}
            {user ? (
              <UserMenu name={user.name ?? null} username={user.username ?? null} image={user.image ?? null} />
            ) : (
              <SignInButton variant="nav" label="Sign In" />
            )}
          </div>
        </div>
      </nav>

      {/* Mobile Menu Overlay (Independent of Mix Blend) */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, transition: { duration: 0.3 } }}
            transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
            className="fixed inset-0 z-60 flex flex-col bg-background/40 backdrop-blur-3xl text-foreground"
          >
            {/* Top Close Button */}
            <div className="absolute right-6 top-6 md:right-10 md:top-6">
              <button
                className="p-2 -mr-2 text-foreground/80 hover:text-foreground focus:outline-none transition-colors"
                onClick={() => setIsOpen(false)}
                aria-label="Close menu"
              >
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M1 1L19 19M1 19L19 1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                </svg>
              </button>
            </div>

            {/* Links Container */}
            <div className="flex flex-1 flex-col items-center justify-center pt-8">
              <div className="flex flex-col items-center gap-10">
                {NAV_LINKS.map((link) => (
                  <button
                    key={link.label}
                    onClick={() => handleMobileNavClick(link.section, false)}
                    className="font-mono text-[14px] font-bold uppercase tracking-[0.3em] text-white/90 hover:text-white transition-colors"
                  >
                    {link.label}
                  </button>
                ))}
                
                <Link
                  href="/explore"
                  onClick={() => handleMobileNavClick(undefined, true)}
                  className="font-mono text-[14px] font-bold uppercase tracking-[0.3em] text-white/90 hover:text-white transition-colors"
                >
                  Explore
                </Link>

                {user ? (
                  <>
                    {user.username && (
                      <Link
                        href={`/u/${user.username}`}
                        onClick={() => handleMobileNavClick(undefined, true)}
                        className="font-mono text-[14px] font-bold uppercase tracking-[0.3em] text-white/90 hover:text-white transition-colors"
                      >
                        Profile
                      </Link>
                    )}
                    <Link
                      href="/dashboard"
                      onClick={() => handleMobileNavClick(undefined, true)}
                      className="font-mono text-[14px] font-bold uppercase tracking-[0.3em] text-white/90 hover:text-white transition-colors"
                    >
                      Dashboard
                    </Link>
                    <button
                      onClick={async () => {
                        setIsOpen(false);
                        await signOut({ redirect: false });
                        router.push('/');
                      }}
                      className="font-mono text-[14px] font-bold uppercase tracking-[0.3em] text-red-500/90 hover:text-red-400 transition-colors"
                    >
                      Sign Out
                    </button>
                  </>
                ) : (
                  <div onClick={() => setIsOpen(false)}>
                    <SignInButton label="Sign In" className="font-mono text-[14px] font-bold uppercase tracking-[0.3em] text-white/90 hover:text-white transition-colors" />
                  </div>
                )}
              </div>

              {/* Separator */}
              <div className="my-10 h-px w-48 bg-white/10" />

              {/* Bottom Avatar / Auth */}
              {user ? (
                <div className="flex items-center gap-5">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-full border border-white/20 bg-secondary">
                    {user.image ? (
                      <img src={user.image} alt="Profile" className="h-full w-full object-cover" />
                    ) : (
                      <span className="font-mono text-base text-foreground">
                        {(user.name ?? 'D').charAt(0).toUpperCase()}
                      </span>
                    )}
                  </div>
                  <div className="flex flex-col text-left">
                    <span className="font-mono text-[15px] font-bold text-white/90">
                      {user.username ? `@${user.username}` : (user.name ?? 'Developer')}
                    </span>
                    <span className="mt-1 font-mono text-[10px] uppercase tracking-[0.25em] text-white/50">
                      Code Afterlife
                    </span>
                  </div>
                </div>
              ) : (
                <div onClick={() => setIsOpen(false)}>
                  <SignInButton variant="cta" label="Authenticate" />
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
