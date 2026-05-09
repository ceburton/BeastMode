'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import Fuse from 'fuse.js';
import { Search, Loader2, Sparkles } from 'lucide-react';
import { Dialog } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import type { Term } from '@/lib/types';

interface SearchPayload {
  terms: Term[];
}

interface PaletteContext {
  open: boolean;
  setOpen: (v: boolean) => void;
}

const Ctx = React.createContext<PaletteContext>({ open: false, setOpen: () => {} });

export function useCommandPalette() {
  return React.useContext(Ctx);
}

const NAV_LINKS: { href: string; label: string; description: string }[] = [
  { href: '/', label: 'Dashboard', description: 'Overview and quick start' },
  { href: '/flashcards', label: 'Flashcards', description: 'Spaced repetition deck' },
  { href: '/quiz', label: 'Practice quiz', description: 'Generate a quick quiz' },
  { href: '/exam', label: 'Full practice exam', description: '75 MCQ + 2 FRQ, timed' },
  { href: '/guide', label: 'Study guide', description: 'Browse all units & terms' },
  { href: '/recall', label: 'Active recall', description: 'Brain dump + self-grade' },
  { href: '/match', label: 'Match game', description: 'Term/definition matching' },
  { href: '/settings', label: 'Settings', description: 'Reset / export / import' },
];

export function CommandPaletteProvider({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = React.useState(false);
  const [query, setQuery] = React.useState('');
  const [terms, setTerms] = React.useState<Term[] | null>(null);
  const [loading, setLoading] = React.useState(false);
  const [activeIdx, setActiveIdx] = React.useState(0);
  const router = useRouter();

  React.useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const isMac = navigator.platform.toLowerCase().includes('mac');
      if ((isMac ? e.metaKey : e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setOpen((v) => !v);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  React.useEffect(() => {
    if (!open || terms !== null) return;
    setLoading(true);
    fetch('/api/search')
      .then((r) => r.json() as Promise<SearchPayload>)
      .then((d) => setTerms(d.terms))
      .finally(() => setLoading(false));
  }, [open, terms]);

  const fuse = React.useMemo(() => {
    if (!terms) return null;
    return new Fuse(terms, {
      keys: ['term', 'definition', 'topicName', 'unitName'],
      threshold: 0.36,
      includeScore: true,
      ignoreLocation: true,
    });
  }, [terms]);

  const termResults = React.useMemo(() => {
    if (!query.trim() || !fuse) return [];
    return fuse.search(query, { limit: 12 }).map((r) => r.item);
  }, [query, fuse]);

  const navResults = React.useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return NAV_LINKS;
    return NAV_LINKS.filter((n) => n.label.toLowerCase().includes(q) || n.description.toLowerCase().includes(q));
  }, [query]);

  const items = React.useMemo(() => {
    return [
      ...navResults.map((n) => ({ kind: 'nav' as const, href: n.href, label: n.label, sub: n.description })),
      ...termResults.map((t) => ({
        kind: 'term' as const,
        href: `/guide?term=${encodeURIComponent(t.id)}`,
        label: t.term,
        sub: `${t.unitName} · ${t.topicName}`,
      })),
    ];
  }, [navResults, termResults]);

  React.useEffect(() => {
    setActiveIdx(0);
  }, [query, items.length]);

  const handleKey = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIdx((i) => Math.min(items.length - 1, i + 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIdx((i) => Math.max(0, i - 1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      const item = items[activeIdx];
      if (item) {
        router.push(item.href);
        setOpen(false);
        setQuery('');
      }
    }
  };

  return (
    <Ctx.Provider value={{ open, setOpen }}>
      {children}
      <Dialog open={open} onOpenChange={setOpen} className="max-w-xl">
        <div className="border-b">
          <div className="flex items-center gap-2 px-4 py-3">
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
            ) : (
              <Search className="h-4 w-4 text-muted-foreground" />
            )}
            <Input
              autoFocus
              placeholder="Search terms, units, pages…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={handleKey}
              className="border-0 focus-visible:ring-0 px-0 text-base"
            />
            <kbd className="rounded border bg-muted px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground">esc</kbd>
          </div>
        </div>
        <div className="max-h-[60vh] overflow-y-auto p-2 scrollbar-thin">
          {items.length === 0 ? (
            <div className="px-3 py-8 text-center text-sm text-muted-foreground">No results.</div>
          ) : (
            <ul role="listbox">
              {items.map((it, idx) => (
                <li key={`${it.kind}-${it.href}-${idx}`}>
                  <button
                    type="button"
                    role="option"
                    aria-selected={idx === activeIdx}
                    onMouseEnter={() => setActiveIdx(idx)}
                    onClick={() => {
                      router.push(it.href);
                      setOpen(false);
                      setQuery('');
                    }}
                    className={cn(
                      'flex w-full flex-col items-start gap-0.5 rounded-md px-3 py-2 text-left transition-colors',
                      idx === activeIdx ? 'bg-accent text-accent-foreground' : 'hover:bg-accent/50'
                    )}
                  >
                    <div className="flex items-center gap-2">
                      <Sparkles
                        className={cn(
                          'h-3 w-3',
                          it.kind === 'term' ? 'text-amber-500' : 'text-primary'
                        )}
                      />
                      <span className="font-medium">{it.label}</span>
                    </div>
                    <span className="ml-5 text-xs text-muted-foreground">{it.sub}</span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </Dialog>
    </Ctx.Provider>
  );
}
