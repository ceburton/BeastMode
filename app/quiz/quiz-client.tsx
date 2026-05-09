'use client';

import * as React from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { UnitPicker } from '@/components/unit-picker';
import { Progress } from '@/components/ui/progress';
import { CheckCircle2, XCircle, ListChecks, ArrowRight, RotateCcw, BarChart3 } from 'lucide-react';
import { cn, formatDuration } from '@/lib/utils';
import type { QuizQuestion } from '@/lib/types';

type Phase = 'config' | 'active' | 'results';

interface AnswerRecord {
  termId: string;
  questionId: string;
  selected: number;
  correct: boolean;
  confidence: number | null;
  timeMs: number;
  questionType: string;
  question: QuizQuestion;
}

const COUNT_OPTIONS = [10, 25, 50];

export default function QuizClient() {
  const search = useSearchParams();
  const initialUnits = React.useMemo(() => {
    const u = search?.get('units');
    if (!u) return [] as number[];
    return u
      .split(',')
      .map((s) => Number(s))
      .filter((n) => Number.isFinite(n) && n >= 1 && n <= 12);
  }, [search]);
  const initialCount = React.useMemo(() => {
    const c = Number(search?.get('count') ?? 10);
    if (COUNT_OPTIONS.includes(c)) return c;
    return 10;
  }, [search]);

  const [phase, setPhase] = React.useState<Phase>('config');
  const [unitIds, setUnitIds] = React.useState<number[]>(initialUnits);
  const [count, setCount] = React.useState<number>(initialCount);

  const [questions, setQuestions] = React.useState<QuizQuestion[]>([]);
  const [idx, setIdx] = React.useState(0);
  const [selected, setSelected] = React.useState<number | null>(null);
  const [confidence, setConfidence] = React.useState<number | null>(null);
  const [revealed, setRevealed] = React.useState(false);
  const [records, setRecords] = React.useState<AnswerRecord[]>([]);
  const [questionStart, setQuestionStart] = React.useState<number>(Date.now());
  const [sessionStart, setSessionStart] = React.useState<number>(Date.now());
  const [attemptId, setAttemptId] = React.useState<number | null>(null);
  const [loading, setLoading] = React.useState(false);

  async function start(reviewAttemptId?: number) {
    setLoading(true);
    setRecords([]);
    const res = await fetch('/api/quiz', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ unitIds, count, reviewAttemptId }),
    });
    const data = (await res.json()) as { questions?: QuizQuestion[]; error?: string };
    setLoading(false);
    if (!data.questions || data.questions.length === 0) {
      alert(data.error ?? 'Could not generate quiz.');
      return;
    }
    setQuestions(data.questions);
    setIdx(0);
    setSelected(null);
    setConfidence(null);
    setRevealed(false);
    setSessionStart(Date.now());
    setQuestionStart(Date.now());
    setPhase('active');
  }

  function submitAnswer() {
    if (selected === null) return;
    const q = questions[idx];
    const record: AnswerRecord = {
      termId: q.termId,
      questionId: q.id,
      selected,
      correct: selected === q.correctIndex,
      confidence,
      timeMs: Date.now() - questionStart,
      questionType: q.type,
      question: q,
    };
    setRecords((r) => [...r, record]);
    setRevealed(true);
  }

  async function nextQuestion() {
    if (idx + 1 >= questions.length) {
      // submit attempt
      const durationS = (Date.now() - sessionStart) / 1000;
      const res = await fetch('/api/quiz', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mode: 'practice',
          unitIds,
          durationS,
          answers: [...records].map((r) => ({
            termId: r.termId,
            correct: r.correct,
            confidence: r.confidence,
            timeMs: r.timeMs,
            questionType: r.questionType,
          })),
        }),
      });
      const data = (await res.json()) as { attemptId: number };
      setAttemptId(data.attemptId);
      setPhase('results');
      return;
    }
    setIdx((i) => i + 1);
    setSelected(null);
    setConfidence(null);
    setRevealed(false);
    setQuestionStart(Date.now());
  }

  if (phase === 'config') {
    return (
      <div className="max-w-3xl space-y-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-semibold tracking-tight">Practice Quiz</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Multiple choice with immediate feedback. Includes scenario, term-to-definition, and definition-to-term questions.
          </p>
        </div>

        <Card>
          <CardContent className="p-6 space-y-5">
            <div>
              <p className="text-sm font-medium mb-2">How many questions?</p>
              <div className="grid grid-cols-3 gap-2">
                {COUNT_OPTIONS.map((c) => (
                  <Button
                    key={c}
                    variant={count === c ? 'default' : 'outline'}
                    onClick={() => setCount(c)}
                  >
                    {c}
                  </Button>
                ))}
              </div>
            </div>
            <UnitPicker value={unitIds} onChange={setUnitIds} />
            <Button onClick={() => start()} disabled={loading} size="lg" className="w-full">
              {loading ? 'Generating…' : <>Start quiz <ArrowRight className="h-4 w-4" /></>}
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (phase === 'active') {
    const q = questions[idx];
    const progressPct = ((idx + (revealed ? 1 : 0)) / questions.length) * 100;
    return (
      <div className="max-w-3xl mx-auto space-y-6">
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-2">
            <Badge variant="outline">U{q.unitId}</Badge>
            <span className="text-muted-foreground">{q.unitName}</span>
            <span className="text-muted-foreground">·</span>
            <span className="text-muted-foreground capitalize">{q.type.replace(/-/g, ' → ')}</span>
          </div>
          <span className="tabular-nums text-muted-foreground">
            {idx + 1} / {questions.length}
          </span>
        </div>

        <Progress value={progressPct} />

        <Card>
          <CardContent className="p-6 space-y-4">
            <p className="text-base md:text-lg whitespace-pre-line leading-relaxed">{q.stem}</p>
            <ul className="space-y-2">
              {q.choices.map((choice, i) => {
                const isCorrect = i === q.correctIndex;
                const isSelected = i === selected;
                let cls = 'border-border hover:bg-accent/40';
                if (revealed) {
                  if (isCorrect) cls = 'border-success/40 bg-success/10 text-success';
                  else if (isSelected && !isCorrect) cls = 'border-destructive/40 bg-destructive/10 text-destructive';
                  else cls = 'border-border opacity-70';
                } else if (isSelected) {
                  cls = 'border-primary bg-primary/5';
                }
                return (
                  <li key={i}>
                    <button
                      type="button"
                      onClick={() => !revealed && setSelected(i)}
                      disabled={revealed}
                      className={cn(
                        'w-full text-left rounded-md border px-4 py-3 transition-colors flex items-start gap-3',
                        cls
                      )}
                    >
                      <span
                        className={cn(
                          'mt-0.5 inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full border text-xs font-medium',
                          revealed && isCorrect && 'bg-success text-success-foreground border-success',
                          revealed && isSelected && !isCorrect && 'bg-destructive text-destructive-foreground border-destructive',
                          !revealed && isSelected && 'bg-primary text-primary-foreground border-primary'
                        )}
                      >
                        {String.fromCharCode(65 + i)}
                      </span>
                      <span className="flex-1">{choice}</span>
                      {revealed && isCorrect && <CheckCircle2 className="h-4 w-4 text-success mt-1" />}
                      {revealed && isSelected && !isCorrect && <XCircle className="h-4 w-4 text-destructive mt-1" />}
                    </button>
                  </li>
                );
              })}
            </ul>

            {!revealed && (
              <div className="rounded-md border bg-muted/30 p-3">
                <div className="text-xs font-medium mb-2">Confidence (optional)</div>
                <div className="flex flex-wrap gap-2">
                  {[
                    { v: 25, label: 'Guess' },
                    { v: 50, label: 'Unsure' },
                    { v: 75, label: 'Likely' },
                    { v: 100, label: 'Certain' },
                  ].map((c) => (
                    <Button
                      key={c.v}
                      size="sm"
                      variant={confidence === c.v ? 'default' : 'outline'}
                      onClick={() => setConfidence(c.v)}
                    >
                      {c.label}
                    </Button>
                  ))}
                </div>
              </div>
            )}

            {revealed && (
              <div className="rounded-md border bg-secondary/30 p-3 space-y-1">
                <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Explanation</div>
                <p className="text-sm whitespace-pre-line">{q.explanation}</p>
                {confidence !== null &&
                  records.length > 0 &&
                  records[records.length - 1] &&
                  ((confidence >= 75 && !records[records.length - 1].correct) ||
                    (confidence <= 50 && records[records.length - 1].correct)) && (
                    <p className="mt-2 text-xs text-amber-600 dark:text-amber-400">
                      {records[records.length - 1].correct
                        ? 'You felt unsure but got it right — trust your reasoning more next time.'
                        : 'You felt confident but missed it — watch for overconfidence on similar questions.'}
                    </p>
                  )}
              </div>
            )}

            <div className="flex items-center justify-between pt-2">
              <Button variant="ghost" onClick={() => setPhase('config')} size="sm">
                <RotateCcw className="h-3 w-3" /> Restart
              </Button>
              {!revealed ? (
                <Button onClick={submitAnswer} disabled={selected === null}>
                  Submit
                </Button>
              ) : (
                <Button onClick={nextQuestion}>
                  {idx + 1 >= questions.length ? 'See results' : 'Next'}
                  <ArrowRight className="h-4 w-4" />
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // results phase
  const score = records.filter((r) => r.correct).length;
  const total = records.length;
  const pct = total > 0 ? Math.round((score / total) * 100) : 0;
  const durationS = (Date.now() - sessionStart) / 1000;
  const missed = records.filter((r) => !r.correct);
  const calibration = (() => {
    const rated = records.filter((r) => r.confidence !== null);
    if (rated.length === 0) return null;
    const avgConfidence = rated.reduce((a, b) => a + (b.confidence ?? 0), 0) / rated.length;
    const accuracy = (rated.filter((r) => r.correct).length / rated.length) * 100;
    return { avgConfidence, accuracy };
  })();

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-semibold tracking-tight">Quiz complete</h1>
        <p className="text-muted-foreground">
          You scored {score} / {total} ({pct}%) in {formatDuration(durationS)}.
        </p>
      </div>

      <Card>
        <CardContent className="p-6 space-y-3">
          <div className="flex items-center justify-between">
            <div className="text-sm text-muted-foreground">Your score</div>
            <Badge variant={pct >= 80 ? 'success' : pct >= 60 ? 'default' : 'destructive'}>
              {pct}%
            </Badge>
          </div>
          <Progress
            value={pct}
            indicatorClassName={
              pct >= 80 ? 'bg-success' : pct >= 60 ? 'bg-amber-500' : 'bg-destructive'
            }
          />
          {calibration && (
            <p className="text-xs text-muted-foreground inline-flex items-center gap-1">
              <BarChart3 className="h-3 w-3" />
              Avg confidence {Math.round(calibration.avgConfidence)}% vs accuracy {Math.round(calibration.accuracy)}%
              {Math.abs(calibration.avgConfidence - calibration.accuracy) > 15 && (
                <span className="ml-2 text-amber-500 font-medium">
                  ({calibration.avgConfidence > calibration.accuracy ? 'overconfident' : 'underconfident'})
                </span>
              )}
            </p>
          )}
        </CardContent>
      </Card>

      {missed.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Missed ({missed.length})</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {missed.map((m) => (
              <div key={m.questionId} className="rounded-md border p-3 space-y-1">
                <div className="text-xs text-muted-foreground">{m.question.unitName} · {m.question.topicName}</div>
                <p className="text-sm">{m.question.stem}</p>
                <p className="text-sm">
                  <span className="text-destructive">You: </span>
                  {m.question.choices[m.selected]}
                </p>
                <p className="text-sm">
                  <span className="text-success">Correct: </span>
                  {m.question.choices[m.question.correctIndex]}
                </p>
                <p className="text-xs text-muted-foreground whitespace-pre-line">{m.question.explanation}</p>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      <div className="flex flex-wrap gap-2">
        {missed.length > 0 && attemptId && (
          <Button onClick={() => start(attemptId)} variant="default">
            <ListChecks className="h-4 w-4" /> Review missed ({missed.length})
          </Button>
        )}
        <Button onClick={() => setPhase('config')} variant="outline">
          New quiz
        </Button>
        <Link href="/">
          <Button variant="ghost">Back to dashboard</Button>
        </Link>
      </div>
    </div>
  );
}
