'use client';

import * as React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Trophy, Timer, RotateCcw } from 'lucide-react';
import { cn, formatDuration } from '@/lib/utils';

interface UnitTerms {
  id: number;
  name: string;
  terms: { id: string; term: string; definition: string }[];
}

interface Tile {
  key: string;
  termId: string;
  type: 'term' | 'def';
  text: string;
  matched: boolean;
}

const PAIRS = 12;

export default function MatchClient({ units }: { units: UnitTerms[] }) {
  const [unitId, setUnitId] = React.useState<number>(units.find((u) => u.terms.length >= PAIRS)?.id ?? units[0]?.id ?? 1);
  const [tiles, setTiles] = React.useState<Tile[]>([]);
  const [active, setActive] = React.useState<number | null>(null);
  const [matched, setMatched] = React.useState(0);
  const [start, setStart] = React.useState<number | null>(null);
  const [now, setNow] = React.useState<number>(Date.now());
  const [done, setDone] = React.useState(false);
  const [bestTimes, setBestTimes] = React.useState<Record<number, number>>({});
  const [misses, setMisses] = React.useState(0);

  React.useEffect(() => {
    const raw = localStorage.getItem('beastmode:match-best');
    if (raw) {
      try {
        setBestTimes(JSON.parse(raw));
      } catch {}
    }
  }, []);

  // Tick timer
  React.useEffect(() => {
    if (start === null || done) return;
    const t = setInterval(() => setNow(Date.now()), 250);
    return () => clearInterval(t);
  }, [start, done]);

  function startGame() {
    const u = units.find((uu) => uu.id === unitId);
    if (!u) return;
    const eligible = u.terms.filter((t) => t.term.length <= 28 && t.definition.length <= 110);
    const pool = eligible.length >= PAIRS ? eligible : u.terms;
    const picks = shuffle(pool).slice(0, Math.min(PAIRS, pool.length));
    const ts: Tile[] = picks.flatMap((t) => [
      { key: `t-${t.id}`, termId: t.id, type: 'term', text: t.term, matched: false },
      { key: `d-${t.id}`, termId: t.id, type: 'def', text: t.definition, matched: false },
    ]);
    setTiles(shuffle(ts));
    setActive(null);
    setMatched(0);
    setMisses(0);
    setDone(false);
    setStart(Date.now());
  }

  function pick(idx: number) {
    if (done) return;
    const tile = tiles[idx];
    if (!tile || tile.matched) return;
    if (active === idx) {
      setActive(null);
      return;
    }
    if (active === null) {
      setActive(idx);
      return;
    }
    const a = tiles[active];
    const b = tile;
    if (a.termId === b.termId && a.type !== b.type) {
      // Match!
      setTiles((prev) =>
        prev.map((t, i) => (i === active || i === idx ? { ...t, matched: true } : t))
      );
      const newMatched = matched + 1;
      setMatched(newMatched);
      setActive(null);
      if (newMatched === PAIRS) {
        const time = (Date.now() - (start ?? Date.now())) / 1000;
        const prev = bestTimes[unitId];
        if (!prev || time < prev) {
          const next = { ...bestTimes, [unitId]: time };
          setBestTimes(next);
          localStorage.setItem('beastmode:match-best', JSON.stringify(next));
        }
        // Log play
        fetch('/api/match', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ unitIds: [unitId], durationS: time, pairs: PAIRS }),
        });
        setDone(true);
      }
    } else {
      setMisses((m) => m + 1);
      // Show both for a beat, then reset
      const aIdx = active;
      const bIdx = idx;
      setActive(idx);
      setTimeout(() => {
        setActive((cur) => (cur === bIdx || cur === aIdx ? null : cur));
      }, 600);
    }
  }

  const elapsed = start === null ? 0 : (now - start) / 1000;
  const eligibleCount = units.find((u) => u.id === unitId)?.terms.length ?? 0;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl md:text-3xl font-semibold tracking-tight">Match Game</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Match {PAIRS} term ↔ definition pairs as quickly as you can.
        </p>
      </div>

      <Card>
        <CardContent className="p-4 flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <span className="text-sm font-medium">Unit</span>
            <Select value={unitId} onChange={(e) => setUnitId(Number(e.target.value))} className="max-w-xs">
              {units
                .filter((u) => u.terms.length >= 4)
                .map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.id}. {u.name} ({u.terms.length})
                  </option>
                ))}
            </Select>
          </div>
          <Button onClick={startGame} disabled={eligibleCount < 4}>
            <RotateCcw className="h-3.5 w-3.5" /> {start ? 'Restart' : 'Start'}
          </Button>
          {start !== null && (
            <div className="flex items-center gap-3">
              <Badge variant="outline" className="font-mono">
                <Timer className="h-3 w-3 mr-1" /> {formatDuration(elapsed)}
              </Badge>
              <Badge variant="outline">{matched}/{PAIRS} pairs</Badge>
              <Badge variant="outline">{misses} misses</Badge>
              {bestTimes[unitId] !== undefined && (
                <Badge variant="success">
                  <Trophy className="h-3 w-3 mr-1" /> Best: {formatDuration(bestTimes[unitId])}
                </Badge>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {done && (
        <Card>
          <CardContent className="p-6 text-center space-y-2">
            <Trophy className="h-8 w-8 text-amber-500 mx-auto" />
            <h2 className="text-xl font-semibold">Cleared in {formatDuration(elapsed)}!</h2>
            <p className="text-sm text-muted-foreground">
              {misses} {misses === 1 ? 'miss' : 'misses'}. {bestTimes[unitId] === elapsed ? 'New best!' : ''}
            </p>
            <Button onClick={startGame}>Play again</Button>
          </CardContent>
        </Card>
      )}

      {tiles.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
          {tiles.map((t, i) => {
            const isActive = active === i;
            return (
              <button
                key={t.key}
                onClick={() => pick(i)}
                disabled={t.matched}
                className={cn(
                  'min-h-[72px] rounded-md border p-3 text-left text-sm transition-all',
                  t.matched
                    ? 'opacity-50 bg-success/10 border-success/30 text-success cursor-default'
                    : isActive
                    ? 'bg-primary/10 border-primary scale-[0.98]'
                    : 'bg-card hover:bg-accent/40 hover:-translate-y-0.5'
                )}
              >
                <span className="text-[10px] uppercase tracking-wide text-muted-foreground">
                  {t.type === 'term' ? 'Term' : 'Definition'}
                </span>
                <div className={cn('mt-0.5 leading-snug', t.type === 'term' && 'font-medium')}>
                  {t.text}
                </div>
              </button>
            );
          })}
        </div>
      )}

      {tiles.length === 0 && (
        <Card>
          <CardContent className="p-6 text-sm text-muted-foreground">
            Pick a unit and hit Start. {PAIRS} pairs are drawn at random — each round is different.
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function shuffle<T>(arr: readonly T[]): T[] {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}
