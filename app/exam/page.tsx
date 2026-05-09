'use client';

import * as React from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { CheckCircle2, XCircle, Clock, Timer, Coffee, FileText, AlertOctagon, ArrowRight } from 'lucide-react';
import { cn, formatDuration } from '@/lib/utils';
import type { QuizQuestion, FrqPrompt } from '@/lib/types';

type Phase = 'ready' | 'mcq' | 'break' | 'frq' | 'submitting' | 'results';

const MCQ_SECONDS = 90 * 60;
const BREAK_SECONDS = 10 * 60;
const FRQ_SECONDS = 70 * 60;

interface AnswerRec {
  termId: string;
  selected: number;
  correct: boolean;
  timeMs: number;
  questionType: string;
  unitId: number;
}

interface ExamPayload {
  questions: QuizQuestion[];
  frqs: { aaq: FrqPrompt; ebq: FrqPrompt };
}

interface ExamResult {
  attemptId: number;
  mcqScore: number;
  mcqTotal: number;
  perUnit: Record<string, { correct: number; total: number }>;
  frqs: { aaq: FrqPrompt; ebq: FrqPrompt };
}

export default function ExamPage() {
  const [phase, setPhase] = React.useState<Phase>('ready');
  const [payload, setPayload] = React.useState<ExamPayload | null>(null);

  const [mcqIdx, setMcqIdx] = React.useState(0);
  const [mcqAnswers, setMcqAnswers] = React.useState<Record<number, number>>({});
  const [mcqStart, setMcqStart] = React.useState<number>(0);
  const [questionStart, setQuestionStart] = React.useState<number>(0);
  const [questionTimes, setQuestionTimes] = React.useState<Record<number, number>>({});

  const [frq1Text, setFrq1Text] = React.useState('');
  const [frq2Text, setFrq2Text] = React.useState('');
  const [frqStart, setFrqStart] = React.useState<number>(0);

  const [breakStart, setBreakStart] = React.useState<number>(0);

  const [result, setResult] = React.useState<ExamResult | null>(null);
  const [now, setNow] = React.useState<number>(Date.now());
  const [examStart, setExamStart] = React.useState<number>(0);
  const [loading, setLoading] = React.useState(false);

  // 1Hz tick during timed phases
  React.useEffect(() => {
    if (phase === 'mcq' || phase === 'break' || phase === 'frq') {
      const t = setInterval(() => setNow(Date.now()), 1000);
      return () => clearInterval(t);
    }
  }, [phase]);

  async function startExam() {
    setLoading(true);
    const res = await fetch('/api/exam');
    const data = (await res.json()) as ExamPayload;
    setPayload(data);
    setMcqAnswers({});
    setQuestionTimes({});
    setMcqIdx(0);
    setFrq1Text('');
    setFrq2Text('');
    setLoading(false);
    const t = Date.now();
    setExamStart(t);
    setMcqStart(t);
    setQuestionStart(t);
    setPhase('mcq');
  }

  function selectAnswer(i: number) {
    setMcqAnswers((a) => ({ ...a, [mcqIdx]: i }));
  }

  function nextMcq() {
    if (!payload) return;
    setQuestionTimes((t) => ({ ...t, [mcqIdx]: (t[mcqIdx] ?? 0) + (Date.now() - questionStart) }));
    setMcqIdx((i) => i + 1);
    setQuestionStart(Date.now());
  }

  function prevMcq() {
    if (mcqIdx === 0) return;
    setQuestionTimes((t) => ({ ...t, [mcqIdx]: (t[mcqIdx] ?? 0) + (Date.now() - questionStart) }));
    setMcqIdx((i) => i - 1);
    setQuestionStart(Date.now());
  }

  function finishMcq() {
    setQuestionTimes((t) => ({ ...t, [mcqIdx]: (t[mcqIdx] ?? 0) + (Date.now() - questionStart) }));
    setBreakStart(Date.now());
    setPhase('break');
  }

  function startFrq() {
    setFrqStart(Date.now());
    setPhase('frq');
  }

  async function submitExam() {
    if (!payload) return;
    setPhase('submitting');
    const records: AnswerRec[] = payload.questions.map((q, i) => ({
      termId: q.termId,
      selected: mcqAnswers[i] ?? -1,
      correct: mcqAnswers[i] === q.correctIndex,
      timeMs: questionTimes[i] ?? 0,
      questionType: q.type,
      unitId: q.unitId,
    }));
    const durationS = (Date.now() - examStart) / 1000;
    const res = await fetch('/api/exam', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        durationS,
        frq1: frq1Text,
        frq2: frq2Text,
        frq1Id: payload.frqs.aaq.id,
        frq2Id: payload.frqs.ebq.id,
        answers: records,
      }),
    });
    const data = (await res.json()) as ExamResult;
    setResult(data);
    setPhase('results');
  }

  if (phase === 'ready') {
    return (
      <div className="max-w-2xl space-y-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-semibold tracking-tight">Full Practice Exam</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Mirrors the real AP Psychology format. Plan to set aside about 3 hours.
          </p>
        </div>
        <Card>
          <CardContent className="p-6 space-y-4">
            <div className="grid sm:grid-cols-2 gap-3">
              <div className="rounded-md border p-3">
                <div className="text-xs text-muted-foreground">Part I</div>
                <div className="text-lg font-semibold">75 multiple choice</div>
                <div className="text-sm text-muted-foreground">90 minutes · 66.7% weight</div>
              </div>
              <div className="rounded-md border p-3">
                <div className="text-xs text-muted-foreground">Break</div>
                <div className="text-lg font-semibold">10 minutes</div>
                <div className="text-sm text-muted-foreground">Standalone screen</div>
              </div>
              <div className="rounded-md border p-3 sm:col-span-2">
                <div className="text-xs text-muted-foreground">Part II</div>
                <div className="text-lg font-semibold">2 free-response questions</div>
                <div className="text-sm text-muted-foreground">
                  70 minutes · 33.3% weight · 1 Article Analysis + 1 Evidence-Based Question
                </div>
              </div>
            </div>
            <div className="rounded-md border-amber-500/30 border bg-amber-500/10 p-3 text-amber-700 dark:text-amber-300 text-sm flex gap-2">
              <AlertOctagon className="h-4 w-4 shrink-0 mt-0.5" />
              <span>
                Once you start, the timer runs continuously through each part. FRQs are not
                auto-graded — after submission you'll see a rubric and key concepts to self-grade against.
              </span>
            </div>
            <Button onClick={startExam} size="lg" className="w-full" disabled={loading}>
              {loading ? 'Loading exam…' : 'Begin Part I'}
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (phase === 'mcq' && payload) {
    const elapsed = (now - mcqStart) / 1000;
    const remaining = Math.max(0, MCQ_SECONDS - elapsed);
    if (remaining <= 0) {
      finishMcq();
    }
    const q = payload.questions[mcqIdx];
    const selected = mcqAnswers[mcqIdx] ?? null;
    const answeredCount = Object.keys(mcqAnswers).length;

    return (
      <div className="max-w-3xl mx-auto space-y-4">
        <div className="flex items-center justify-between">
          <Badge variant="outline" className="text-sm">Part I · MCQ</Badge>
          <div className="flex items-center gap-2 tabular-nums">
            <Timer className={cn('h-4 w-4', remaining < 600 && 'text-amber-500', remaining < 60 && 'text-destructive')} />
            <span className={cn('font-mono text-sm', remaining < 600 && 'text-amber-500', remaining < 60 && 'text-destructive')}>
              {formatTime(remaining)}
            </span>
          </div>
        </div>

        <Progress value={((mcqIdx + 1) / payload.questions.length) * 100} />

        <div className="text-sm text-muted-foreground flex items-center justify-between">
          <span>Question {mcqIdx + 1} of {payload.questions.length}</span>
          <span>{answeredCount} answered</span>
        </div>

        <Card>
          <CardContent className="p-6 space-y-4">
            <p className="text-base whitespace-pre-line leading-relaxed">{q.stem}</p>
            <ul className="space-y-2">
              {q.choices.map((choice, i) => {
                const isSelected = i === selected;
                return (
                  <li key={i}>
                    <button
                      type="button"
                      onClick={() => selectAnswer(i)}
                      className={cn(
                        'w-full text-left rounded-md border px-4 py-3 transition-colors flex items-start gap-3',
                        isSelected ? 'border-primary bg-primary/5' : 'border-border hover:bg-accent/40'
                      )}
                    >
                      <span
                        className={cn(
                          'mt-0.5 inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full border text-xs font-medium',
                          isSelected && 'bg-primary text-primary-foreground border-primary'
                        )}
                      >
                        {String.fromCharCode(65 + i)}
                      </span>
                      <span className="flex-1">{choice}</span>
                    </button>
                  </li>
                );
              })}
            </ul>
          </CardContent>
        </Card>

        <div className="flex items-center justify-between gap-2">
          <Button onClick={prevMcq} variant="outline" disabled={mcqIdx === 0}>
            Previous
          </Button>
          <div className="text-xs text-muted-foreground">Skipped count toward your time. You can revisit.</div>
          {mcqIdx + 1 < payload.questions.length ? (
            <Button onClick={nextMcq}>Next <ArrowRight className="h-4 w-4" /></Button>
          ) : (
            <Button onClick={finishMcq} variant="default">
              Finish Part I
            </Button>
          )}
        </div>

        <McqGrid total={payload.questions.length} answers={mcqAnswers} active={mcqIdx} onJump={(i) => {
          setQuestionTimes((t) => ({ ...t, [mcqIdx]: (t[mcqIdx] ?? 0) + (Date.now() - questionStart) }));
          setMcqIdx(i);
          setQuestionStart(Date.now());
        }} />
      </div>
    );
  }

  if (phase === 'break') {
    const elapsed = (now - breakStart) / 1000;
    const remaining = Math.max(0, BREAK_SECONDS - elapsed);
    return (
      <div className="max-w-xl mx-auto space-y-6">
        <Card className="text-center">
          <CardContent className="p-10 space-y-3">
            <div className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-amber-500/10 text-amber-500 mx-auto">
              <Coffee className="h-6 w-6" />
            </div>
            <h2 className="text-2xl font-semibold">Take a 10-minute break.</h2>
            <p className="text-muted-foreground text-sm">
              Stand up, hydrate, look out a window. Part II resumes when you're ready.
            </p>
            <div className="text-3xl font-mono tabular-nums">{formatTime(remaining)}</div>
            <Button onClick={startFrq} size="lg">
              Skip break · Start Part II
            </Button>
            {remaining <= 0 && (
              <p className="text-xs text-muted-foreground">Break is up — head into Part II.</p>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  if (phase === 'frq' && payload) {
    const elapsed = (now - frqStart) / 1000;
    const remaining = Math.max(0, FRQ_SECONDS - elapsed);
    if (remaining <= 0) {
      submitExam();
    }
    return (
      <div className="max-w-3xl mx-auto space-y-4">
        <div className="flex items-center justify-between">
          <Badge variant="outline" className="text-sm">Part II · FRQ</Badge>
          <div className="flex items-center gap-2 tabular-nums">
            <Timer className={cn('h-4 w-4', remaining < 600 && 'text-amber-500', remaining < 60 && 'text-destructive')} />
            <span className={cn('font-mono text-sm', remaining < 600 && 'text-amber-500', remaining < 60 && 'text-destructive')}>
              {formatTime(remaining)}
            </span>
          </div>
        </div>

        <FrqEditor frq={payload.frqs.aaq} value={frq1Text} onChange={setFrq1Text} number={1} />
        <FrqEditor frq={payload.frqs.ebq} value={frq2Text} onChange={setFrq2Text} number={2} />

        <div className="flex items-center justify-end">
          <Button onClick={submitExam} size="lg">
            Submit Exam
          </Button>
        </div>
      </div>
    );
  }

  if (phase === 'submitting') {
    return (
      <div className="max-w-md mx-auto pt-12">
        <Card>
          <CardContent className="p-6 text-center space-y-2">
            <p className="text-sm">Scoring your exam…</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (phase === 'results' && result && payload) {
    const pct = Math.round((result.mcqScore / result.mcqTotal) * 100);
    const apScore = estimateApScore(pct);
    const perUnit = Object.entries(result.perUnit)
      .map(([uid, v]) => ({ unitId: Number(uid), ...v }))
      .sort((a, b) => a.unitId - b.unitId);
    const weakest = [...perUnit]
      .filter((u) => u.total >= 3)
      .sort((a, b) => a.correct / a.total - b.correct / b.total)
      .slice(0, 3);

    return (
      <div className="max-w-3xl mx-auto space-y-6">
        <div className="text-center space-y-1">
          <h1 className="text-3xl font-semibold tracking-tight">Exam complete</h1>
          <p className="text-muted-foreground text-sm">Self-grade your FRQs against the rubric below.</p>
        </div>

        <Card>
          <CardContent className="p-6 grid grid-cols-2 gap-6">
            <div>
              <div className="text-xs text-muted-foreground">MCQ score</div>
              <div className="text-3xl font-semibold tabular-nums">{result.mcqScore} / {result.mcqTotal}</div>
              <div className="text-sm text-muted-foreground">{pct}%</div>
            </div>
            <div className="text-right">
              <div className="text-xs text-muted-foreground">Estimated AP score (MCQ only)</div>
              <div className="text-5xl font-semibold tabular-nums">{apScore}</div>
              <div className="text-xs text-muted-foreground">FRQs not auto-graded</div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Per-unit breakdown</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {perUnit.map((u) => {
              const upct = Math.round((u.correct / u.total) * 100);
              return (
                <div key={u.unitId} className="space-y-1">
                  <div className="flex justify-between text-sm">
                    <span>U{u.unitId}</span>
                    <span className="tabular-nums text-muted-foreground">
                      {u.correct} / {u.total} · {upct}%
                    </span>
                  </div>
                  <Progress
                    value={upct}
                    indicatorClassName={
                      upct >= 80 ? 'bg-success' : upct >= 60 ? 'bg-amber-500' : 'bg-destructive'
                    }
                  />
                </div>
              );
            })}
          </CardContent>
        </Card>

        {weakest.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Suggested study focus</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {weakest.map((u) => (
                <div key={u.unitId} className="flex items-center justify-between gap-2">
                  <span className="text-sm">Unit {u.unitId}</span>
                  <Link href={`/quiz?units=${u.unitId}&count=10`}>
                    <Button size="sm" variant="secondary">
                      Drill {Math.round((u.correct / u.total) * 100)}% →
                    </Button>
                  </Link>
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        <FrqResult frq={result.frqs.aaq} response={frq1Text} number={1} />
        <FrqResult frq={result.frqs.ebq} response={frq2Text} number={2} />

        <div className="flex flex-wrap gap-2">
          <Link href="/">
            <Button>Back to dashboard</Button>
          </Link>
          <Link href="/exam">
            <Button variant="outline">Take another exam</Button>
          </Link>
        </div>
      </div>
    );
  }

  return null;
}

function formatTime(sec: number): string {
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  const h = Math.floor(m / 60);
  const mm = m % 60;
  if (h > 0) return `${h}:${String(mm).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  return `${String(mm).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

function McqGrid({
  total,
  answers,
  active,
  onJump,
}: {
  total: number;
  answers: Record<number, number>;
  active: number;
  onJump: (i: number) => void;
}) {
  return (
    <Card>
      <CardContent className="p-3">
        <div className="grid grid-cols-10 sm:grid-cols-15 gap-1.5">
          {Array.from({ length: total }, (_, i) => {
            const answered = answers[i] !== undefined;
            return (
              <button
                key={i}
                onClick={() => onJump(i)}
                className={cn(
                  'h-7 rounded text-xs font-mono transition-colors',
                  i === active
                    ? 'bg-primary text-primary-foreground'
                    : answered
                    ? 'bg-success/20 text-success border border-success/30'
                    : 'bg-secondary text-muted-foreground hover:bg-accent'
                )}
                aria-label={`Jump to question ${i + 1}`}
              >
                {i + 1}
              </button>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}

function FrqEditor({
  frq,
  value,
  onChange,
  number,
}: {
  frq: FrqPrompt;
  value: string;
  onChange: (s: string) => void;
  number: 1 | 2;
}) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between gap-2">
          <CardTitle className="text-base">
            Question {number}: {frq.kind === 'AAQ' ? 'Article Analysis' : 'Evidence-Based Question'}
          </CardTitle>
          <Badge variant="secondary">{frq.kind}</Badge>
        </div>
        <p className="text-xs text-muted-foreground mt-1">{frq.title}</p>
      </CardHeader>
      <CardContent className="space-y-3">
        <pre className="whitespace-pre-wrap rounded-md bg-muted/40 p-3 text-sm leading-relaxed font-sans">
          {frq.scenario}
        </pre>
        <ol className="space-y-2 text-sm">
          {frq.questions.map((q, i) => (
            <li key={i} className="flex gap-2">
              <span className="font-semibold w-5 shrink-0">({q.label})</span>
              <span>{q.prompt}</span>
            </li>
          ))}
        </ol>
        <Textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          rows={10}
          placeholder="Write your response here. Address each lettered part directly."
          className="font-sans"
        />
        <div className="text-xs text-muted-foreground">
          {value.split(/\s+/).filter(Boolean).length} words
        </div>
      </CardContent>
    </Card>
  );
}

function FrqResult({ frq, response, number }: { frq: FrqPrompt; response: string; number: 1 | 2 }) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between gap-2">
          <CardTitle className="text-base">FRQ {number}: {frq.title}</CardTitle>
          <Badge variant="secondary">{frq.kind}</Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground mb-1">
            <FileText className="h-3 w-3 inline mr-1" /> Your response
          </div>
          {response.trim() ? (
            <pre className="whitespace-pre-wrap rounded-md border bg-muted/30 p-3 text-sm font-sans">{response}</pre>
          ) : (
            <p className="text-sm italic text-muted-foreground">No response submitted.</p>
          )}
        </div>
        <div>
          <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground mb-1">Rubric (self-grade)</div>
          <ol className="space-y-1.5 text-sm">
            {frq.rubric.map((r, i) => (
              <li key={i} className="flex gap-2">
                <span className="text-success font-semibold shrink-0">+{r.points}</span>
                <span>{r.criteria}</span>
              </li>
            ))}
          </ol>
          <p className="mt-2 text-xs text-muted-foreground">
            Total possible: {frq.rubric.reduce((a, b) => a + b.points, 0)} points
          </p>
        </div>
        <div>
          <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground mb-1">Key concepts to hit</div>
          <div className="flex flex-wrap gap-1.5">
            {frq.modelKeyConcepts.map((c) => (
              <Badge key={c} variant="outline">{c}</Badge>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function estimateApScore(pct: number): number {
  // Rough mapping based on typical AP curve. For self-assessment only.
  if (pct >= 75) return 5;
  if (pct >= 62) return 4;
  if (pct >= 50) return 3;
  if (pct >= 38) return 2;
  return 1;
}
