'use client';

import * as React from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select } from '@/components/ui/select';
import { Textarea } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Sparkles, ArrowRight, RotateCcw } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Term } from '@/lib/types';

interface UnitWithTopics {
  id: number;
  name: string;
  slug: string;
  topics: { id: number; name: string; terms: Term[] }[];
}

type Phase = 'pick' | 'dump' | 'review' | 'done';

export default function RecallClient({ units }: { units: UnitWithTopics[] }) {
  const [phase, setPhase] = React.useState<Phase>('pick');
  const [unitId, setUnitId] = React.useState<number>(units[0]?.id ?? 1);
  const [topicId, setTopicId] = React.useState<number | null>(null);
  const [dumpText, setDumpText] = React.useState('');
  const [recalled, setRecalled] = React.useState<Set<string>>(new Set());
  const [start, setStart] = React.useState<number>(0);
  const [accuracy, setAccuracy] = React.useState<number>(0);

  const currentUnit = units.find((u) => u.id === unitId)!;
  const topics = currentUnit?.topics ?? [];
  const currentTopic = topics.find((t) => t.id === topicId) ?? topics[0];

  React.useEffect(() => {
    if (topics.length && !topics.some((t) => t.id === topicId)) setTopicId(topics[0]?.id ?? null);
  }, [topics, topicId]);

  function startDump() {
    setDumpText('');
    setRecalled(new Set());
    setStart(Date.now());
    setPhase('dump');
  }

  function autoMark() {
    if (!currentTopic) return;
    const lower = dumpText.toLowerCase();
    const matched = new Set<string>();
    for (const t of currentTopic.terms) {
      // Match term name with simple containment (lowercase, ignoring parentheses content)
      const stripped = t.term.replace(/\([^)]*\)/g, '').trim().toLowerCase();
      if (stripped.length < 3) continue;
      if (lower.includes(stripped)) matched.add(t.id);
    }
    setRecalled(matched);
    setPhase('review');
  }

  function toggleRecall(id: string) {
    setRecalled((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  async function finalize(rating: 'low' | 'mid' | 'high') {
    if (!currentTopic) return;
    const durationS = (Date.now() - start) / 1000;
    const totalIds = currentTopic.terms.map((t) => t.id);
    const recalledIds = Array.from(recalled);
    const res = await fetch('/api/recall', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        topicId: currentTopic.id,
        recalledTermIds: recalledIds,
        totalTermIds: totalIds,
        durationS,
        selfRating: rating,
      }),
    });
    const data = (await res.json()) as { accuracy: number };
    setAccuracy(data.accuracy);
    setPhase('done');
  }

  if (phase === 'pick') {
    return (
      <div className="max-w-2xl space-y-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-semibold tracking-tight">Active Recall</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Pick a topic, type everything you remember, then compare to the source. Retrieval beats re-reading.
          </p>
        </div>
        <Card>
          <CardContent className="p-6 space-y-4">
            <div>
              <label className="text-sm font-medium mb-1.5 block">Unit</label>
              <Select value={unitId} onChange={(e) => setUnitId(Number(e.target.value))}>
                {units.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.id}. {u.name}
                  </option>
                ))}
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium mb-1.5 block">Topic</label>
              <Select value={topicId ?? ''} onChange={(e) => setTopicId(Number(e.target.value))}>
                {topics.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name} ({t.terms.length})
                  </option>
                ))}
              </Select>
            </div>
            <Button onClick={startDump} disabled={!currentTopic} size="lg" className="w-full">
              Start brain dump <ArrowRight className="h-4 w-4" />
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (phase === 'dump' && currentTopic) {
    return (
      <div className="max-w-3xl mx-auto space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <Badge variant="outline">U{currentUnit.id}</Badge>
            <span className="ml-2 text-sm text-muted-foreground">
              {currentUnit.name} · <span className="font-medium text-foreground">{currentTopic.name}</span>
            </span>
          </div>
          <Button variant="ghost" size="sm" onClick={() => setPhase('pick')}>
            <RotateCcw className="h-3 w-3" /> Change topic
          </Button>
        </div>
        <Card>
          <CardContent className="p-6 space-y-3">
            <p className="text-sm">
              Without looking at any notes, type everything you remember about <strong>{currentTopic.name}</strong>.
              Don't worry about completeness or grammar — get it on the page.
            </p>
            <Textarea
              autoFocus
              rows={14}
              placeholder="What's the topic about? Key terms, definitions, scenarios, examples…"
              value={dumpText}
              onChange={(e) => setDumpText(e.target.value)}
            />
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">{dumpText.split(/\s+/).filter(Boolean).length} words</span>
              <Button onClick={autoMark} disabled={dumpText.trim().length < 3}>
                I'm done — show the answer key
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (phase === 'review' && currentTopic) {
    const recalledCount = recalled.size;
    return (
      <div className="max-w-3xl mx-auto space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <Badge variant="outline">U{currentUnit.id}</Badge>
            <span className="ml-2 text-sm text-muted-foreground">
              {currentUnit.name} · <span className="font-medium text-foreground">{currentTopic.name}</span>
            </span>
          </div>
          <span className="text-sm tabular-nums">
            {recalledCount} / {currentTopic.terms.length} marked
          </span>
        </div>

        <Card>
          <CardContent className="p-6 space-y-2">
            <p className="text-sm">
              Side-by-side check: tick the ones you actually got. We auto-marked any term whose name appears in your dump — refine as needed.
            </p>
            <details className="rounded-md border bg-muted/30 p-3 text-sm">
              <summary className="cursor-pointer font-medium">Show your brain dump</summary>
              <pre className="whitespace-pre-wrap mt-2 font-sans">{dumpText}</pre>
            </details>
          </CardContent>
        </Card>

        <ul className="space-y-2">
          {currentTopic.terms.map((t) => {
            const got = recalled.has(t.id);
            return (
              <li
                key={t.id}
                className={cn(
                  'flex items-start gap-3 rounded-md border p-3 transition-colors',
                  got ? 'border-success/30 bg-success/5' : 'border-border'
                )}
              >
                <Checkbox checked={got} onCheckedChange={() => toggleRecall(t.id)} aria-label={`Recalled: ${t.term}`} />
                <div className="flex-1">
                  <div className="font-medium">{t.term}</div>
                  <div className="text-sm text-muted-foreground">{t.definition}</div>
                  {t.mnemonic && (
                    <div className="mt-1 inline-flex items-center gap-1 rounded-md bg-amber-500/10 text-amber-700 dark:text-amber-300 border border-amber-500/20 px-2 py-0.5 text-xs">
                      <Sparkles className="h-3 w-3" />
                      <span>{t.mnemonic}</span>
                    </div>
                  )}
                </div>
              </li>
            );
          })}
        </ul>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">How did that feel?</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-2">
            <Button variant="destructive" onClick={() => finalize('low')}>
              Rough — review again soon
            </Button>
            <Button variant="secondary" onClick={() => finalize('mid')}>
              Mixed — schedule for review
            </Button>
            <Button variant="success" onClick={() => finalize('high')}>
              Strong — most things stuck
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (phase === 'done') {
    return (
      <div className="max-w-md mx-auto space-y-4 pt-4">
        <Card>
          <CardContent className="p-6 text-center space-y-2">
            <h2 className="text-xl font-semibold">Recall logged.</h2>
            <p className="text-muted-foreground text-sm">
              You recalled <strong>{Math.round(accuracy * 100)}%</strong> of the topic's terms.
            </p>
            <div className="flex justify-center gap-2 pt-2">
              <Button onClick={() => setPhase('pick')}>Another topic</Button>
              <Link href="/">
                <Button variant="outline">Dashboard</Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return null;
}
