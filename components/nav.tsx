'use client';

import * as React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Brain, GraduationCap, Layers, ListChecks, BookOpen, PencilLine, Grid3X3, Settings, Search } from 'lucide-react';
import { ThemeToggle } from '@/components/theme-toggle';
import { cn } from '@/lib/utils';

const NAV_ITEMS = [
  { href: '/', label: 'Dashboard', Icon: Brain },
  { href: '/flashcards', label: 'Flashcards', Icon: Layers },
  { href: '/quiz', label: 'Quiz', Icon: ListChecks },
  { href: '/exam', label: 'Exam', Icon: GraduationCap },
  { href: '/guide', label: 'Guide', Icon: BookOpen },
  { href: '/recall', label: 'Recall', Icon: PencilLine },
  { href: '/match', label: 'Match', Icon: Grid3X3 },
];

export function Nav({ onOpenSearch }: { onOpenSearch?: () => void }) {
  const pathname = usePathname() ?? '/';
  return (
    <header className="sticky top-0 z-30 w-full border-b bg-background/80 backdrop-blur">
      <div className="container flex h-14 items-center gap-2">
        <Link href="/" className="mr-2 flex items-center gap-2 font-semibold">
          <span aria-hidden className="inline-flex h-7 w-7 items-center justify-center rounded-md bg-primary/15 text-primary">
            <Brain className="h-4 w-4" />
          </span>
          <span>BeastMode</span>
        </Link>
        <nav className="ml-2 hidden md:flex items-center gap-0.5 overflow-x-auto scrollbar-thin">
          {NAV_ITEMS.map(({ href, label, Icon }) => {
            const active = href === '/' ? pathname === '/' : pathname.startsWith(href);
            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  'inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm transition-colors',
                  active
                    ? 'bg-secondary text-foreground font-medium'
                    : 'text-muted-foreground hover:text-foreground hover:bg-secondary/60'
                )}
              >
                <Icon className="h-3.5 w-3.5" />
                {label}
              </Link>
            );
          })}
        </nav>
        <div className="ml-auto flex items-center gap-1">
          <button
            onClick={onOpenSearch}
            className="hidden md:inline-flex items-center gap-2 rounded-md border bg-background px-2 py-1.5 text-xs text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors"
            aria-label="Search (Cmd+K)"
          >
            <Search className="h-3.5 w-3.5" />
            <span>Search…</span>
            <kbd className="ml-2 rounded border bg-muted px-1.5 py-0.5 font-mono text-[10px]">⌘K</kbd>
          </button>
          <Link
            href="/settings"
            className="inline-flex items-center justify-center h-9 w-9 rounded-md text-muted-foreground hover:text-foreground hover:bg-secondary"
            aria-label="Settings"
          >
            <Settings className="h-4 w-4" />
          </Link>
          <ThemeToggle />
        </div>
      </div>

      {/* Mobile nav */}
      <nav className="container md:hidden flex items-center gap-1 overflow-x-auto pb-2 scrollbar-thin">
        {NAV_ITEMS.map(({ href, label, Icon }) => {
          const active = href === '/' ? pathname === '/' : pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                'inline-flex items-center gap-1 rounded-md px-2.5 py-1 text-xs whitespace-nowrap transition-colors',
                active ? 'bg-secondary text-foreground' : 'text-muted-foreground hover:text-foreground'
              )}
            >
              <Icon className="h-3 w-3" />
              {label}
            </Link>
          );
        })}
      </nav>
    </header>
  );
}
