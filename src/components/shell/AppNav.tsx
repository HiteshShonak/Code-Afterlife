'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion } from 'framer-motion';

interface NavItem {
  href:  string;
  label: string;
}

const NAV_ITEMS: NavItem[] = [
  { href: '/explore', label: 'Explore' }, { href: '/search', label: 'Search'   },
  { href: '/dashboard', label: 'Dashboard' },
  { href: '/graveyard', label: 'Graveyard' },
];

/** Single nav link with animated active underline. */
export const NavLink = ({ href, label }: NavItem) => {
  const pathname = usePathname();
  const isActive = pathname === href || pathname.startsWith(`${href}/`);

  return (
    <Link
      href={href}
      className={[
        'relative font-mono text-[11px] uppercase tracking-[0.18em] transition-colors duration-200',
        isActive
          ? 'text-foreground'
          : 'text-muted-foreground hover:text-foreground',
      ].join(' ')}
    >
      {label}
      {isActive && (
        <motion.span
          layoutId="nav-underline"
          className="absolute inset-x-0 -bottom-px h-px bg-accent"
          transition={{ type: 'spring', bounce: 0.2, duration: 0.4 }}
        />
      )}
    </Link>
  );
};

/** Mobile + desktop nav items list. */
export function AppNav() {
  return (
    <nav className="flex items-center gap-7">
      {NAV_ITEMS.map((item) => (
        <NavLink key={item.href} {...item} />
      ))}
    </nav>
  );
}
