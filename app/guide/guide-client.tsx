'use client';

import * as React from 'react';
import { useSearchParams } from 'next/navigation';
import Fuse from 'fuse.js';
import { ChevronDown, ChevronRight, Sparkles, Search, Printer } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import type { Term } from '@/lib/types';

interface UnitWithTopics {
  id: number;
  name: string;
  slug: string;
  topics: { id: number; name: string; terms: Term[] }[];
}

export default function GuideClient({ units }: { units: UnitWithTopics[] }) {
  const search = useSearchParams();
  const focusTermId = search?.get('term') ?? null;

  const [query, setQuery] = React.useState('');
  const [openUnits, setOpenUnits] = React.useState<Set<number>>(() => new Set([1]));

  const allTerms = React.useMemo(() => {
    const flat: Term[] = [];
    for (const u of units) for (const t of u.topics) flat.push(...t.terms);
    return flat;
  }, [units]);

  // If a focus term is provided, expand its unit
  React.useEffect(() => {
    if (!focusTermId) return;
    const t = allTerms.find((tt) => tt.id === focusTermId);
    if (t) {
      setOpenUnits((prev) => new Set([...Array.from(prev), t.unitId]));
      setTimeout(() => {
        const el = document.getElementById(`term-${t.id}`);
        if (el) {
          el.scrollIntoView({ block: 'center', behavior: 'smooth' });
          el.classList.add('ring-2', 'ring-primary', 'ring-offset-2', 'ring-offset-background');
          setTimeout(() => el.classList.remove('ring-2', 'ring-primary', 'ring-offset-2', 'ring-offset-background'), 2400);
        }
      }, 300);
    }
  }, [focusTermId, allTerms]);

  const fuse = React.useMemo(
    () =>
      new Fuse(allTerms, {
        keys: ['term', 'definition', 'topicName', 'unitName', 'mnemonic'],
        threshold: 0.36,
        ignoreLocation: true,
      }),
    [allTerms]
  );

  const matchSet = React.useMemo(() => {
    if (!query.trim()) return null;
    const ids = new Set<string>();
    for (const r of fuse.search(query, { limit: 200 })) ids.add(r.item.id);
    return ids;
  }, [query, fuse]);

  const filteredUnits = React.useMemo(() => {
    if (!matchSet) return units;
    return units
      .map((u) => ({
        ...u,
        topics: u.topics
          .map((t) => ({ ...t, terms: t.terms.filter((tm) => matchSet.has(tm.id)) }))
          .filter((t) => t.terms.length > 0),
      }))
      .filter((u) => u.topics.length > 0);
  }, [units, matchSet]);

  // Auto-expand all when searching
  React.useEffect(() => {
    if (query.trim()) {
      setOpenUnits(new Set(filteredUnits.map((u) => u.id)));
    }
  }, [query, filteredUnits]);

  function toggleUnit(id: number) {
    setOpenUnits((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <div>
          <h1 className="text-2xl md:text-3xl font-semibold tracking-tight">Study Guide</h1>
          <p className="text-sm text-muted-foreground mt-1">
            All terms organized by unit and topic. Press <kbd className="rounded border bg-muted px-1.5 py-0.5 font-mono text-[10px]">⌘K</kbd> for fuzzy search across the app.
          </p>
        </div>
        <div className="flex gap-2 no-print">
          <Button variant="outline" size="sm" onClick={() => setOpenUnits(new Set(units.map((u) => u.id)))}>
            Expand all
          </Button>
          <Button variant="outline" size="sm" onClick={() => setOpenUnits(new Set())}>
            Collapse all
          </Button>
          <Button variant="outline" size="sm" onClick={() => window.print()}>
            <Printer className="h-3.5 w-3.5" /> Print
          </Button>
        </div>
      </div>

      <div className="relative no-print">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search terms, definitions, topics…"
          className="pl-9"
          aria-label="Search terms"
        />
        {query && (
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
            {filteredUnits.reduce((a, u) => a + u.topics.reduce((b, t) => b + t.terms.length, 0), 0)} matches
          </span>
        )}
      </div>

      <div className="space-y-3">
        {filteredUnits.length === 0 && (
          <Card>
            <CardContent className="p-6">
              <p className="text-sm text-muted-foreground">No matches.</p>
            </CardContent>
          </Card>
        )}
        {filteredUnits.map((u) => {
          const open = openUnits.has(u.id);
          const totalTerms = u.topics.reduce((a, t) => a + t.terms.length, 0);
          return (
            <Card key={u.id} className="overflow-hidden">
              <button
                onClick={() => toggleUnit(u.id)}
                className="w-full flex items-center justify-between gap-2 px-5 py-3 hover:bg-accent/40 transition-colors"
                aria-expanded={open}
              >
                <div className="flex items-center gap-3">
                  {open ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                  <span className="font-medium">{u.id}. {u.name}</span>
                </div>
                <Badge variant="outline" className="font-normal">{totalTerms} terms</Badge>
              </button>
              {open && (
                <div className="border-t bg-card/50 divide-y">
                  {u.topics.map((t) => (
                    <details key={t.id} open className="px-5 py-3">
                      <summary className="cursor-pointer text-sm font-medium select-none flex items-center justify-between">
                        <span>{t.name}</span>
                        <span className="text-xs text-muted-foreground">{t.terms.length}</span>
                      </summary>
                      <ul className="mt-2 space-y-2">
                        {t.terms.map((term) => (
                          <li
                            key={term.id}
                            id={`term-${term.id}`}
                            className="rounded-md p-2 hover:bg-accent/30 transition-colors transition-shadow"
                          >
                            <div className="flex items-start justify-between gap-3">
                              <div>
                                <div className="font-medium">
                                  <Highlighted text={term.term} query={query} />
                                </div>
                                <div className="text-sm text-muted-foreground">
                                  <Highlighted text={term.definition} query={query} />
                                </div>
                                {term.mnemonic && (
                                  <div className="mt-1.5 inline-flex items-center gap-1 rounded-md bg-amber-500/10 text-amber-700 dark:text-amber-300 border border-amber-500/20 px-2 py-0.5 text-xs">
                                    <Sparkles className="h-3 w-3" />
                                    <span>{term.mnemonic}</span>
                                  </div>
                                )}
                              </div>
                            </div>
                          </li>
                        ))}
                      </ul>
                    </details>
                  ))}
                </div>
              )}
            </Card>
          );
        })}
      </div>
    </div>
  );
}

function Highlighted({ text, query }: { text: string; query: string }) {
  if (!query.trim()) return <>{text}</>;
  const parts = text.split(new RegExp(`(${escapeRegex(query.trim())})`, 'ig'));
  return (
    <>
      {parts.map((p, i) =>
        p.toLowerCase() === query.trim().toLowerCase() ? (
          <mark key={i} className="bg-amber-200/70 dark:bg-amber-500/40 text-foreground rounded px-0.5">
            {p}
          </mark>
        ) : (
          <React.Fragment key={i}>{p}</React.Fragment>
        )
      )}
    </>
  );
}

function escapeRegex(s: string) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
