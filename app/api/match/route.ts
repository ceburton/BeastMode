import { NextResponse } from 'next/server';
import { logStudySession } from '@/lib/stats';
import { getDb } from '@/lib/db';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

interface MatchBody {
  unitIds: number[];
  durationS: number;
  pairs: number;
  misses?: number;
}

export async function GET() {
  const db = getDb();
  const bestTimes = db
    .prepare('SELECT unit_id AS unitId, seconds, misses, pairs, taken_at AS takenAt FROM match_best_times ORDER BY unit_id')
    .all();
  return NextResponse.json({ bestTimes });
}

export async function POST(req: Request) {
  const body = (await req.json()) as MatchBody;
  const unitId = body.unitIds[0];
  const seconds = body.durationS;
  if (unitId && Number.isFinite(seconds) && seconds > 0) {
    const db = getDb();
    const existing = db.prepare('SELECT seconds FROM match_best_times WHERE unit_id = ?').get(unitId) as
      | { seconds: number }
      | undefined;
    if (!existing || seconds < existing.seconds) {
      db.prepare(
        `INSERT INTO match_best_times(unit_id, seconds, misses, pairs, taken_at)
         VALUES(?, ?, ?, ?, ?)
         ON CONFLICT(unit_id) DO UPDATE SET
           seconds = excluded.seconds,
           misses = excluded.misses,
           pairs = excluded.pairs,
           taken_at = excluded.taken_at`
      ).run(unitId, seconds, body.misses ?? 0, body.pairs, new Date().toISOString());
    }
  }
  logStudySession('match', body.durationS);
  return NextResponse.json({ ok: true });
}
