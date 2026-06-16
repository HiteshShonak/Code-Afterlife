'use client';

import Link from 'next/link';
import { Search, Bell } from 'lucide-react';
import { AppNav } from './AppNav';
import { UserMenu } from './UserMenu';
import { useEffect, useState } from 'react';

interface AppHeaderClientProps {
  user: {
    id:       string;
    name:     string | null;
    username: string | null;
    image:    string | null;
  };
}

export function AppHeaderClient({ user }: AppHeaderClientProps) {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <header
      className={[
        'sticky top-0 z-40 w-full transition-all duration-300',
        scrolled
          ? 'border-b border-border bg-background/80 backdrop-blur-md'
          : 'border-b border-transparent bg-background/0',
      ].join(' ')}
    >
      <div className="mx-auto flex h-16 max-w-[1400px] items-center justify-between px-6 md:px-10">
        {/* left side */}
        <div className="flex items-center gap-10">
          <Link
            href="/search"
            className="flex items-center gap-2 transition-opacity hover:opacity-80"
          >
            <span className="font-mono text-xl leading-none">âš°</span>
            <span className="font-mono text-[13px] font-bold tracking-widest text-foreground">
              CODE AFTERLIFE
            </span>
          </Link>
          <div className="hidden md:block">
            <AppNav />
          </div>
        </div>

        {/* right side */}
        <div className="flex items-center gap-6">
          <div className="hidden lg:block relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search projects..."
              className="h-9 w-64 rounded-full border border-border bg-secondary/50 pl-9 pr-4 font-mono text-[11px] text-foreground outline-none transition-colors placeholder:text-muted-foreground focus:border-accent/60 focus:bg-secondary focus:ring-1 focus:ring-accent"
            />
          </div>
          
          <button className="relative text-muted-foreground transition-colors hover:text-foreground">
            <Bell className="h-4 w-4" />
            {/* unread indicator */}
            <span className="absolute -right-0.5 -top-0.5 h-2 w-2 rounded-full bg-accent" />
          </button>
          
          <UserMenu {...user} />
        </div>
      </div>
    </header>
  );
}
