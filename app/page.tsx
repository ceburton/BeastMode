import Link from 'next/link';
import { dashboardStats } from '@/lib/stats';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { ProgressRing } from '@/components/progress-ring';
import { Layers, ListChecks, GraduationCap, BookOpen, PencilLine, Grid3X3, Clock, Flame, AlertTriangle } from 'lucide-react';
import { formatDuration, formatDate } from '@/lib/utils';

export const dynamic = 'force-dynamic';

const QUICK_ACTIONS = [
  { href: '/flashcards', label: 'Flashcards', desc: 'Review due cards', Icon: Layers, accent: 'bg-violet-500/10 text-violet-500' },
  { href: '/quiz', label: 'Practice Quiz', desc: '10–50 questions', Icon: ListChecks, accent: 'bg-sky-500/10 text-sky-500' },
  { href: '/exam', label: 'Full Exam', desc: '75 MCQ + 2 FRQ', Icon: GraduationCap, accent: 'bg-rose-500/10 text-rose-500' },
  { href: '/guide', label: 'Study Guide', desc: 'Browse content', Icon: BookOpen, accent: 'bg-emerald-500/10 text-emerald-500' },
  { href: '/recall', label: 'Active Recall', desc: 'Brain dump', Icon: PencilLine, accent: 'bg-amber-500/10 text-amber-500' },
  { href: '/match', label: 'Match Game', desc: '12 pairs vs. clock', Icon: Grid3X3, accent: 'bg-pink-500/10 text-pink-500' },
];

export default function DashboardPage() {
  const stats = dashboardStats();
  const masteryPct = stats.totalCards > 0 ? Math.round((stats.mastered / stats.totalCards) * 100) : 0;
  const studiedTodayMin = Math.round(stats.studiedTodayS / 60);
  const studiedWeekMin = Math.round(stats.studiedThisWeekS / 60);
  const hasAnyAttempts = stats.recentAttempts.length > 0;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl md:text-3xl font-semibold tracking-tight">Dashboard</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Beast-mode prep for the AP Psychology exam. Pick a study mode below.
        </p>
      </div>

      {/* Top stat strip */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <ProgressRing value={stats.mastered} max={stats.totalCards || 1} label={`${masteryPct}%`} sub="mastered" />
            <div>
              <div className="text-xs text-muted-foreground">Cards mastered</div>
              <div className="text-xl font-semibold">{stats.mastered} / {stats.totalCards}</div>
              <div className="text-xs text-muted-foreground">
                {stats.learning} learning · {stats.newCount} new
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 flex flex-col gap-1">
            <div className="text-xs text-muted-foreground inline-flex items-center gap-1">
              <Clock className="h-3 w-3" /> Due for review
            </div>
            <div className="text-3xl font-semibold leading-tight">{stats.dueToday}</div>
            <Link href="/flashcards" className="mt-auto">
              <Button size="sm" variant="secondary" className="w-full">Start session</Button>
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 flex flex-col gap-1">
            <div className="text-xs text-muted-foreground inline-flex items-center gap-1">
              <Flame className="h-3 w-3" /> Study streak
            </div>
            <div className="text-3xl font-semibold leading-tight">{stats.studyStreakDays}<span className="text-base text-muted-foreground"> day{stats.studyStreakDays === 1 ? '' : 's'}</span></div>
            <div className="text-xs text-muted-foreground">
              {stats.studyStreakDays === 0 ? 'Start one today!' : 'Keep it going.'}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 flex flex-col gap-1">
            <div className="text-xs text-muted-foreground">Studied this week</div>
            <div className="text-3xl font-semibold leading-tight">{studiedWeekMin}<span className="text-base text-muted-foreground"> min</span></div>
            <div className="text-xs text-muted-foreground">{studiedTodayMin} min today</div>
          </CardContent>
        </Card>
      </div>

      {/* Quick start grid */}
      <section>
        <h2 className="text-sm font-medium text-muted-foreground mb-3">Quick start</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          {QUICK_ACTIONS.map(({ href, label, desc, Icon, accent }) => (
            <Link key={href} href={href} className="group">
              <Card className="h-full transition-all group-hover:-translate-y-0.5 group-hover:shadow-md">
                <CardContent className="p-4">
                  <div className={`mb-3 inline-flex h-9 w-9 items-center justify-center rounded-md ${accent}`}>
                    <Icon className="h-4 w-4" />
                  </div>
                  <div className="font-medium">{label}</div>
                  <div className="text-xs text-muted-foreground">{desc}</div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </section>

      <div className="grid lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">Accuracy by unit</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {stats.accuracyByUnit.map((u) => {
              const pct = u.total > 0 ? Math.round(u.accuracy * 100) : 0;
              return (
                <div key={u.unitId} className="space-y-1">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium">{u.unitId}. {u.unitName}</span>
                    <span className="text-muted-foreground tabular-nums">
                      {u.total > 0 ? `${pct}% · ${u.correct}/${u.total}` : 'no data'}
                    </span>
                  </div>
                  <Progress
                    value={pct}
                    indicatorClassName={
                      u.total === 0
                        ? 'bg-muted'
                        : pct >= 80
                        ? 'bg-success'
                        : pct >= 60
                        ? 'bg-amber-500'
                        : 'bg-destructive'
                    }
                  />
                </div>
              );
            })}
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base inline-flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-amber-500" />
                Weak areas
              </CardTitle>
            </CardHeader>
            <CardContent>
              {stats.weakAreas.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  Take a few quizzes to see your weakest units.
                </p>
              ) : (
                <ul className="space-y-2">
                  {stats.weakAreas.map((u) => (
                    <li key={u.unitId} className="flex items-center justify-between gap-2">
                      <Link
                        href={`/quiz?units=${u.unitId}&count=10`}
                        className="text-sm font-medium hover:underline truncate"
                      >
                        {u.unitName}
                      </Link>
                      <Badge variant="destructive">{Math.round(u.accuracy * 100)}%</Badge>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Recent attempts</CardTitle>
            </CardHeader>
            <CardContent>
              {!hasAnyAttempts ? (
                <p className="text-sm text-muted-foreground">No quizzes yet — try one!</p>
              ) : (
                <ul className="space-y-2">
                  {stats.recentAttempts.map((a) => (
                    <li key={a.id} className="flex items-center justify-between text-sm">
                      <span className="capitalize text-muted-foreground">{a.mode.replace('-', ' ')}</span>
                      <span className="tabular-nums">
                        {a.score}/{a.total}
                      </span>
                      <span className="text-xs text-muted-foreground">{formatDate(a.takenAt)}</span>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
