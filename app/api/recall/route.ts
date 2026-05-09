import { NextResponse } from 'next/server';
import { logStudySession } from '@/lib/stats';
import { getDb } from '@/lib/db';
import { todayISO } from '@/lib/utils';

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

  const upsert = db.transaction(() => {
    const insertNew = db.prepare(
      'INSERT INTO card_progress(term_id, interval_days, ease, reviews, lapses, due_date, last_review) VALUES(?, ?, ?, ?, ?, ?, ?)'
    );
    const updateExisting = db.prepare(
      'UPDATE card_progress SET reviews = reviews + 1, last_review = ? WHERE term_id = ?'
    );

    for (const termId of body.totalTermIds) {
      const exists = db.prepare('SELECT 1 AS x FROM card_progress WHERE term_id = ?').get(termId) as
        | { x: 1 }
        | undefined;
      if (recalled.has(termId)) {
        // Treat a recalled term like a "good" review in SRS
        if (!exists) {
          insertNew.run(termId, 1, 2.5, 1, 0, dueDate(today, 1), new Date().toISOString());
        } else {
          updateExisting.run(new Date().toISOString(), termId);
        }
      } else {
        // Treat a missed term as needing review tomorrow
        if (!exists) {
          insertNew.run(termId, 0, 2.5, 1, 1, dueDate(today, 0), new Date().toISOString());
        }
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
