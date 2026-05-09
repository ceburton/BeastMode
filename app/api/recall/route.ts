import { NextResponse } from 'next/server';
import { logStudySession } from '@/lib/stats';
import { getDb } from '@/lib/db';
import { nowISO, todayISO } from '@/lib/utils';
import { nextSchedule } from '@/lib/srs';
import type { Grade } from '@/lib/types';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

interface RecallBody {
  topicId: number;
  recalledTermIds: string[];
  totalTermIds: string[];
  durationS: number;
  selfRating: 'low' | 'mid' | 'high';
}

export async function POST(req: Request) {
  const body = (await req.json()) as RecallBody;
  if (!body.totalTermIds.length) return NextResponse.json({ error: 'No terms.' }, { status: 400 });

  const db = getDb();
  const recalled = new Set(body.recalledTermIds);
  const today = todayISO();
  const reviewGrade: Grade = body.selfRating === 'high' ? 'easy' : body.selfRating === 'mid' ? 'good' : 'hard';

  const upsert = db.transaction(() => {
    const insertNew = db.prepare(
      'INSERT INTO card_progress(term_id, interval_days, ease, reviews, lapses, due_date, last_review) VALUES(?, ?, ?, ?, ?, ?, ?)'
    );
    const updateExisting = db.prepare(
      `UPDATE card_progress
       SET interval_days = ?, ease = ?, reviews = ?, lapses = ?, due_date = ?, last_review = ?
       WHERE term_id = ?`
    );
    const selectExisting = db.prepare(
      'SELECT interval_days, ease, reviews, lapses FROM card_progress WHERE term_id = ?'
    );

    for (const termId of body.totalTermIds) {
      const existing = selectExisting.get(termId) as
        | { interval_days: number; ease: number; reviews: number; lapses: number }
        | undefined;
      const grade: Grade = recalled.has(termId) ? reviewGrade : 'again';
      const current = existing ?? { interval_days: 0, ease: 2.5, reviews: 0, lapses: 0 };
      const next = nextSchedule(
        {
          intervalDays: current.interval_days,
          ease: current.ease,
          reviews: current.reviews,
          lapses: current.lapses,
        },
        grade
      );
      const reviews = current.reviews + 1;
      const lapses = current.lapses + next.lapsesDelta;
      const nextDueDate = dueDate(today, next.intervalDays);
      const reviewedAt = nowISO();
      if (existing) {
        updateExisting.run(next.intervalDays, next.ease, reviews, lapses, nextDueDate, reviewedAt, termId);
      } else {
        insertNew.run(termId, next.intervalDays, next.ease, reviews, lapses, nextDueDate, reviewedAt);
      }
    }
  });
  upsert();
  logStudySession('recall', body.durationS);
  const accuracy = body.totalTermIds.length > 0 ? recalled.size / body.totalTermIds.length : 0;
  return NextResponse.json({ accuracy, recalled: recalled.size, total: body.totalTermIds.length });
}

function dueDate(today: string, daysAhead: number): string {
  const d = new Date(today);
  d.setUTCDate(d.getUTCDate() + daysAhead);
  return d.toISOString().slice(0, 10);
}
