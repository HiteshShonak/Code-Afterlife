'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { signOut } from 'next-auth/react';
import Link from 'next/link';

interface UserMenuProps {
  name:     string | null;
  username: string | null;
  image:    string | null;
}

// user menu
export const UserMenu = ({ name, username, image }: UserMenuProps) => {
  const [open, setOpen]   = useState(false);
  const ref               = useRef<HTMLDivElement>(null);
  const router            = useRouter();
  const displayName       = username ? `@${username}` : (name ?? 'Developer');

  // close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleSignOut = async () => {
    await signOut({ redirect: false });
    router.push('/');
  };

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex h-8 w-8 items-center justify-center overflow-hidden rounded-full border border-border bg-secondary transition-all hover:border-accent/60 focus:outline-none focus:ring-1 focus:ring-accent"
        aria-label="User menu"
        aria-expanded={open}
      >
        {image ? (
          <Image src={image} alt={displayName} width={32} height={32} className="rounded-full" priority />
        ) : (
          <span className="font-mono text-xs text-foreground">
            {(name ?? 'D').charAt(0).toUpperCase()}
          </span>
        )}
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -4 }}
            animate={{ opacity: 1, scale: 1,    y: 0   }}
            exit={{    opacity: 0, scale: 0.95, y: -4   }}
            transition={{ duration: 0.15 }}
            className="absolute right-0 top-10 z-50 w-52 overflow-hidden rounded-xl border border-border bg-card shadow-2xl shadow-black/40"
          >
            {/* identity */}
            <div className="border-b border-border px-4 py-3">
              <p className="font-mono text-[11px] text-foreground">{displayName}</p>
              <p className="mt-0.5 font-mono text-[9px] uppercase tracking-widest text-muted-foreground">
                Code Afterlife
              </p>
            </div>

            {/* menu items */}
            <div className="py-1">
              {username && (
                <MenuLink href={`/u/${username}`} onClick={() => setOpen(false)}>
                  Profile
                </MenuLink>
              )}
              <MenuLink href="/dashboard" onClick={() => setOpen(false)}>
                Dashboard
              </MenuLink>
              <div className="my-1 border-t border-border" />
              <button
                onClick={handleSignOut}
                className="w-full px-4 py-2 text-left font-mono text-[11px] text-destructive transition-colors hover:bg-secondary"
              >
                Sign out
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

function MenuLink({ href, onClick, children }: {
  href:     string;
  onClick:  () => void;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      onClick={onClick}
      className="block px-4 py-2 font-mono text-[11px] text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
    >
      {children}
    </Link>
  );
}
