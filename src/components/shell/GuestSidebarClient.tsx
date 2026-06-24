'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';
import {
  Compass, Skull, Search,
  Info, Mail, HelpCircle, Menu, X, Crown, type LucideIcon, ChevronRight,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { SignInButton } from '@/components/auth/SignInButton';

// types

interface NavItemDef {
  href:  string;
  label: string;
  icon:  LucideIcon;
}

// nav config

const PRIMARY_NAV: NavItemDef[] = [
  { href: '/explore',  label: 'Explore',        icon: Compass },
  { href: '/search',   label: 'Search',          icon: Search  },
  { href: '/legacy',   label: 'Hall of Legacy',  icon: Crown   },
  { href: '/graveyard', label: 'Graveyard',       icon: Skull   },
];

const SECONDARY_NAV: NavItemDef[] = [
  { href: '/faq',     label: 'FAQ',        icon: HelpCircle },
  { href: '/about',   label: 'About',      icon: Info       },
  { href: '/contact', label: 'Contact Us', icon: Mail       },
];

// css keyframes

const SIDEBAR_STYLES = `
@keyframes guest-sidebar-slide-in {
  from { transform: translateX(-40px); opacity: 0; }
  to   { transform: translateX(0);     opacity: 1; }
}
`;

// nav item

function NavItem({ href, label, icon: Icon, active }: NavItemDef & { active: boolean }) {
  return (
    <Link
      href={href}
      className={cn(
        'group relative flex items-center gap-3.5 rounded-xl px-4 py-3 font-mono text-[13px] font-medium transition-all duration-200',
        active
          ? 'bg-accent/15 text-accent shadow-sm shadow-accent/10'
          : 'text-muted-foreground hover:bg-white/6 hover:text-foreground',
      )}
    >
      {active && (
        <motion.div
          layoutId="guest-nav-active-bar"
          className="absolute left-0 top-2 bottom-2 w-0.5 rounded-full bg-accent"
          transition={{ type: 'spring', damping: 28, stiffness: 300 }}
        />
      )}
      <Icon
        className={cn(
          'h-[18px] w-[18px] shrink-0 transition-colors',
          active ? 'text-accent' : 'text-muted-foreground/70 group-hover:text-foreground',
        )}
      />
      <span className="flex-1 leading-none">{label}</span>
      {active && <ChevronRight className="h-3.5 w-3.5 text-accent/50" />}
    </Link>
  );
}

// main component

export function GuestSidebarClient() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  const [sidebarKey, setSidebarKey] = useState(pathname);
  useEffect(() => {
    setSidebarKey(pathname);
    setMobileOpen(false);
  }, [pathname]);

  const isActive = (item: NavItemDef) =>
    pathname === item.href || pathname.startsWith(`${item.href}/`);

  // sidebar body
  const SidebarBody = () => (
    <div className="flex h-full flex-col">
      {/* brand */}
      <div className="mb-10 px-5 pt-4">
        <Link href="/" className="flex items-center gap-3 group">
          <Image
            src="/logo.webp"
            alt="Code Afterlife"
            width={32}
            height={32}
            className="transition-transform duration-300 group-hover:scale-110"
          />
          <div>
            <p className="font-mono text-[14px] font-extrabold tracking-[0.18em] text-foreground uppercase">
              Code Afterlife
            </p>
          </div>
        </Link>
      </div>

      {/* sign in */}
      <div className="mx-3 mb-8">
        <SignInButton variant="sidebar" label="Sign In with GitHub" />
      </div>

      {/* primary nav */}
      <p className="mb-2 px-5 font-mono text-[10px] uppercase tracking-[0.25em] text-muted-foreground/40">
        Navigation
      </p>
      <nav className="flex flex-col gap-1 px-3 mb-4">
        {PRIMARY_NAV.map((item) => (
          <NavItem
            key={item.href}
            {...item}
            active={isActive(item)}
          />
        ))}
      </nav>

      <div className="mx-5 my-6 border-t border-white/6" />

      {/* secondary nav */}
      <p className="mb-2 px-5 font-mono text-[10px] uppercase tracking-[0.25em] text-muted-foreground/40">
        More
      </p>
      <nav className="flex flex-col gap-1 px-3">
        {SECONDARY_NAV.map((item) => (
          <NavItem key={item.href} {...item} active={isActive(item)} />
        ))}
      </nav>

      <div className="flex-1" />

      {/* footer hint */}
      <div className="px-5 pb-6">
        <div className="mx-0 my-4 border-t border-white/6" />
        <p className="font-mono text-[10px] text-muted-foreground/30 leading-relaxed">
          Software Never Dies.<br />
          <span className="text-muted-foreground/20">Code Afterlife - A cinematic graveyard for abandoned projects.</span>
        </p>
      </div>
    </div>
  );

  return (
    <>
      {/* inject css keyframes */}
      <style dangerouslySetInnerHTML={{ __html: SIDEBAR_STYLES }} />

      {/* desktop sidebar */}
      <aside
        key={sidebarKey}
        className="fixed left-4 top-4 z-40 hidden h-[calc(100vh-2rem)] w-64 flex-col overflow-y-auto rounded-2xl border border-white/8 bg-background/75 py-4 shadow-2xl shadow-black/50 backdrop-blur-2xl lg:flex"
        style={{
          WebkitBackdropFilter: 'blur(24px)',
          animation: 'guest-sidebar-slide-in 0.5s cubic-bezier(0.2, 0.8, 0.2, 1) both',
        }}
      >
        <SidebarBody />
      </aside>

      {/* mobile hamburger */}
      <button
        onClick={() => setMobileOpen(true)}
        className="fixed left-4 bottom-4 z-50 flex h-11 w-11 items-center justify-center rounded-xl border border-border bg-background/80 text-muted-foreground shadow-lg backdrop-blur-md transition-colors hover:text-foreground lg:hidden"
        aria-label="Open menu"
      >
        <Menu className="h-5 w-5" />
      </button>

      {/* mobile drawer */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div
              key="guest-overlay"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm lg:hidden"
              onClick={() => setMobileOpen(false)}
            />
            <motion.aside
              key="guest-drawer"
              initial={{ x: -300 }}
              animate={{ x: 0 }}
              exit={{ x: -300 }}
              transition={{ type: 'spring', damping: 30, stiffness: 300 }}
              className="fixed left-0 top-0 z-50 flex h-full w-72 flex-col overflow-y-auto border-r border-white/8 bg-background/95 py-4 shadow-2xl shadow-black/60 backdrop-blur-2xl lg:hidden"
            >
              <button
                onClick={() => setMobileOpen(false)}
                className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-lg border border-border text-muted-foreground hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </button>
              <SidebarBody />
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
