'use client';

import * as React from 'react';
import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { UnitPicker } from '@/components/unit-picker';
import { Sparkles, ChevronRight, RotateCcw } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Grade, Term } from '@/lib/types';

interface DueCard {
  term: Term;
  intervalDays: number;
  ease: number;
  reviews: number;
  lapses: number;
  dueDate: string;
  isNew: boolean;
}

type Scope = 'due' | 'all' | 'new';

export default function FlashcardsPage() {
  const [unitIds, setUnitIds] = React.useState<number[]>([]);
  const [scope, setScope] = React.useState<Scope>('due');
  const [deck, setDeck] = React.useState<DueCard[] | null>(null);
  const [idx, setIdx] = React.useState(0);
  const [revealed, setRevealed] = React.useState(false);
  const [reviewedCount, setReviewedCount] = React.useState(0);
  const [sessionStart, setSessionStart] = React.useState<number | null>(null);
  const [sessionEnded, setSessionEnded] = React.useState(false);
  const [loading, setLoading] = React.useState(false);

  async function loadDeck() {
    setLoading(true);
    setDeck(null);
    setSessionEnded(false);
    setIdx(0);
    setRevealed(false);
    setReviewedCount(0);
    const params = new URLSearchParams({ scope, limit: '100' });
    if (unitIds.length) params.set('units', unitIds.join(','));
    const res = await fetch(`/api/srs?${params.toString()}`);
    const data = (await res.json()) as { deck: DueCard[] };
    setDeck(data.deck);
    setLoading(false);
    setSessionStart(Date.now());
  }

  async function grade(g: Grade) {
    if (!deck || sessionEnded) return;
    const card = deck[idx];
    if (!card) return;
    setRevealed(false);
    const sessionSeconds = sessionStart ? (Date.now() - sessionStart) / 1000 : undefined;
    fetch('/api/srs', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ termId: card.term.id, grade: g, sessionSeconds: 0 }),
    });
    setReviewedCount((c) => c + 1);
    if (idx + 1 >= deck.length) {
      // session done
      setSessionEnded(true);
      if (sessionSeconds) {
        // Log session time as one final write so we don't double-count per card
        fetch('/api/srs', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ termId: card.term.id, grade: g, sessionSeconds: Math.round(sessionSeconds) }),
        });
      }
      return;
    }
    setIdx((i) => i + 1);
  }

  // keyboard shortcuts
  React.useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (!deck || sessionEnded) return;
      if (e.target && (e.target as HTMLElement).tagName === 'INPUT') return;
      if (e.code === 'Space') {
        e.preventDefault();
        setRevealed((r) => !r);
        return;
      }
      if (!revealed) return;
      if (e.key === '1') grade('again');
      else if (e.key === '2') grade('hard');
      else if (e.key === '3') grade('good');
      else if (e.key === '4') grade('easy');
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });

  if (deck === null) {
    return (
      <div className="space-y-6 max-w-3xl">
        <div>
          <h1 className="text-2xl md:text-3xl font-semibold tracking-tight">Flashcards</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Spaced-repetition deck. Self-grade each card; the algorithm will schedule the next review.
          </p>
        </div>

        <Card>
          <CardContent className="p-6 space-y-4">
            <div>
              <p className="text-sm font-medium mb-2">What to study</p>
              <div className="grid grid-cols-3 gap-2">
                {(['due', 'all', 'new'] as Scope[]).map((s) => (
                  <Button
                    key={s}
                    variant={scope === s ? 'default' : 'outline'}
                    onClick={() => setScope(s)}
                    className="capitalize"
                  >
                    {s === 'due' ? 'Due today' : s === 'all' ? 'All cards' : 'New only'}
                  </Button>
                ))}
              </div>
            </div>

            <UnitPicker value={unitIds} onChange={setUnitIds} />

            <Button onClick={loadDeck} disabled={loading} size="lg" className="w-full">
              {loading ? 'Loading…' : 'Start session'}
            </Button>
            <p className="text-xs text-muted-foreground">
              Tip: <kbd className="rounded border bg-muted px-1.5 py-0.5 font-mono text-[10px]">space</kbd> to flip,{' '}
              <kbd className="rounded border bg-muted px-1.5 py-0.5 font-mono text-[10px]">1–4</kbd> to grade.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (sessionEnded || deck.length === 0) {
    return (
      <div className="max-w-2xl space-y-6">
        <h1 className="text-2xl md:text-3xl font-semibold tracking-tight">Session done.</h1>
        {deck.length === 0 ? (
          <Card>
            <CardContent className="p-6">
              <p className="text-sm text-muted-foreground">
                Nothing matched your filters. {scope === 'due' ? "You're caught up — try All or New." : 'Try different filters.'}
              </p>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardContent className="p-6 space-y-3">
              <p className="text-sm">
                Reviewed <strong>{reviewedCount}</strong> {reviewedCount === 1 ? 'card' : 'cards'}.
              </p>
              <p className="text-xs text-muted-foreground">
                Next session: come back tomorrow for spaced reviews — or hit "Study more" to keep going.
              </p>
            </CardContent>
          </Card>
        )}
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setDeck(null)}>
            Configure another session
          </Button>
          <Link href="/">
            <Button variant="ghost">Back to dashboard</Button>
          </Link>
        </div>
      </div>
    );
  }

  const card = deck[idx];
  const progressPct = Math.round(((idx + (revealed ? 0.5 : 0)) / deck.length) * 100);

  return (
    <div className="max-w-3xl mx-auto">
      <div className="mb-4 flex items-center justify-between text-sm">
        <div className="flex items-center gap-3">
          <Badge variant="outline">U{card.term.unitId}</Badge>
          <span className="text-muted-foreground">{card.term.unitName}</span>
          <span className="text-muted-foreground">·</span>
          <span className="text-muted-foreground">{card.term.topicName}</span>
        </div>
        <div className="text-muted-foreground tabular-nums">
          {idx + 1} / {deck.length}
        </div>
      </div>

      <div className="mb-4 h-1 w-full overflow-hidden rounded-full bg-secondary">
        <div className="h-full bg-primary transition-all duration-500" style={{ width: `${progressPct}%` }} />
      </div>

      <div
        role="button"
        tabIndex={0}
        aria-label={revealed ? 'Hide answer' : 'Reveal answer'}
        onClick={() => setRevealed((r) => !r)}
        onKeyDown={(e) => {
          if (e.key === 'Enter') setRevealed((r) => !r);
        }}
        className={cn('perspective h-[320px] md:h-[380px] cursor-pointer select-none focus-visible:outline-none')}
      >
        <div className={cn('relative h-full w-full preserve-3d transition-transform duration-500', revealed && 'rotate-y-180')}>
          <Card className="absolute inset-0 backface-hidden flex flex-col items-center justify-center p-8 shadow-md">
            <CardContent className="text-center space-y-3">
              <Badge variant="secondary" className="mb-2">
                {card.isNew ? 'New' : `Reviewed ${card.reviews}× · interval ${Math.round(card.intervalDays)}d`}
              </Badge>
              <h2 className="text-3xl md:text-4xl font-semibold tracking-tight">{card.term.term}</h2>
              <p className="text-sm text-muted-foreground">Click or press space to reveal.</p>
            </CardContent>
          </Card>
          <Card className="absolute inset-0 backface-hidden rotate-y-180 flex flex-col p-6 md:p-8 shadow-md">
            <CardContent className="flex flex-col h-full text-left p-0">
              <div className="text-xs text-muted-foreground mb-1">Definition</div>
              <p className="text-base md:text-lg">{card.term.definition}</p>
              {card.term.mnemonic && (
                <div className="mt-4 rounded-md border border-amber-500/30 bg-amber-500/10 p-3 text-amber-700 dark:text-amber-300">
                  <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-wide">
                    <Sparkles className="h-3 w-3" /> Mnemonic
                  </div>
                  <div className="mt-1 text-sm">{card.term.mnemonic}</div>
                </div>
              )}
              <div className="mt-auto pt-4 text-xs text-muted-foreground">
                {card.term.unitName} · {card.term.topicName}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {!revealed ? (
        <div className="mt-6 flex items-center justify-center gap-2">
          <Button onClick={() => setRevealed(true)} size="lg">
            Reveal <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      ) : (
        <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-2">
          <GradeButton color="destructive" label="Again" hint="1" sub="< 10 min" onClick={() => grade('again')} />
          <GradeButton color="warn" label="Hard" hint="2" sub="↑ small" onClick={() => grade('hard')} />
          <GradeButton color="good" label="Good" hint="3" sub="ease × i" onClick={() => grade('good')} />
          <GradeButton color="easy" label="Easy" hint="4" sub="big jump" onClick={() => grade('easy')} />
        </div>
      )}

      <div className="mt-4 flex items-center justify-between text-xs text-muted-foreground">
        <button
          className="inline-flex items-center gap-1 hover:text-foreground"
          onClick={() => setDeck(null)}
          aria-label="End session"
        >
          <RotateCcw className="h-3 w-3" /> End session
        </button>
        <span>
          <kbd className="rounded border bg-muted px-1 py-0.5 font-mono text-[10px]">space</kbd> flip ·{' '}
          <kbd className="rounded border bg-muted px-1 py-0.5 font-mono text-[10px]">1–4</kbd> grade
        </span>
      </div>
    </div>
  );
}

function GradeButton({
  color,
  label,
  hint,
  sub,
  onClick,
}: {
  color: 'destructive' | 'warn' | 'good' | 'easy';
  label: string;
  hint: string;
  sub: string;
  onClick: () => void;
}) {
  const cls = {
    destructive: 'bg-destructive/10 text-destructive border-destructive/20 hover:bg-destructive/20',
    warn: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20 hover:bg-amber-500/20',
    good: 'bg-success/10 text-success border-success/20 hover:bg-success/20',
    easy: 'bg-primary/10 text-primary border-primary/20 hover:bg-primary/20',
  }[color];

  return (
    <button onClick={onClick} className={cn('rounded-lg border px-4 py-3 text-left transition-colors', cls)}>
      <div className="flex items-center justify-between">
        <span className="font-semibold">{label}</span>
        <kbd className="rounded border bg-background/50 px-1.5 py-0.5 font-mono text-[10px]">{hint}</kbd>
      </div>
      <div className="text-xs opacity-80 mt-0.5">{sub}</div>
    </button>
  );
}
