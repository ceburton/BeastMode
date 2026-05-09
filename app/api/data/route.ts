import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * Export all user progress as JSON. Source content (units/topics/terms) is
 * included so the file is fully self-describing.
 */
export async function GET() {
  const db = getDb();
  const dump = {
    exportedAt: new Date().toISOString(),
    cardProgress: db.prepare('SELECT * FROM card_progress').all(),
    quizAttempts: db.prepare('SELECT * FROM quiz_attempts').all(),
    quizAnswers: db.prepare('SELECT * FROM quiz_answers').all(),
    examAttempts: db.prepare('SELECT * FROM exam_attempts').all(),
    studySessions: db.prepare('SELECT * FROM study_sessions').all(),
    userSettings: db.prepare('SELECT * FROM user_settings').all(),
  };
  return new NextResponse(JSON.stringify(dump, null, 2), {
    headers: {
      'Content-Type': 'application/json',
      'Content-Disposition': `attachment; filename="beastmode-progress-${new Date().toISOString().slice(0, 10)}.json"`,
    },
  });
}

/**
 * DELETE: reset all user progress (keep source content intact).
 */
export async function DELETE() {
  const db = getDb();
  db.exec(`
    DELETE FROM quiz_answers;
    DELETE FROM quiz_attempts;
    DELETE FROM exam_attempts;
    DELETE FROM study_sessions;
    DELETE FROM card_progress;
    DELETE FROM user_settings;
  `);
  return NextResponse.json({ ok: true });
}

/**
 * POST: import a previously-exported progress dump (replaces existing progress).
 */
export async function POST(req: Request) {
  const data = (await req.json()) as {
    cardProgress?: Array<{
      term_id: string;
      interval_days: number;
      ease: number;
      reviews: number;
      lapses: number;
      due_date: string;
      last_review: string | null;
    }>;
    quizAttempts?: Array<{
      id: number;
      mode: string;
      unit_ids_json: string;
      score: number;
      total: number;
      duration_s: number;
      taken_at: string;
    }>;
    quizAnswers?: Array<{
      id: number;
      attempt_id: number;
      term_id: string;
      correct: number;
      confidence: number | null;
      time_ms: number;
      question_type: string;
    }>;
    examAttempts?: any[];
    studySessions?: Array<{ mode: string; seconds: number; taken_at: string }>;
  };
  const db = getDb();
  const reset = db.transaction(() => {
    db.exec(`
      DELETE FROM quiz_answers;
      DELETE FROM quiz_attempts;
      DELETE FROM exam_attempts;
      DELETE FROM study_sessions;
      DELETE FROM card_progress;
    `);
    if (data.cardProgress) {
      const ins = db.prepare(
        'INSERT INTO card_progress(term_id, interval_days, ease, reviews, lapses, due_date, last_review) VALUES(?, ?, ?, ?, ?, ?, ?)'
      );
      for (const c of data.cardProgress) {
        try {
          ins.run(c.term_id, c.interval_days, c.ease, c.reviews, c.lapses, c.due_date, c.last_review);
        } catch {}
      }
    }
    if (data.quizAttempts) {
      const ins = db.prepare(
        'INSERT INTO quiz_attempts(id, mode, unit_ids_json, score, total, duration_s, taken_at) VALUES(?, ?, ?, ?, ?, ?, ?)'
      );
      for (const a of data.quizAttempts) {
        try {
          ins.run(a.id, a.mode, a.unit_ids_json, a.score, a.total, a.duration_s, a.taken_at);
        } catch {}
      }
    }
    if (data.quizAnswers) {
      const ins = db.prepare(
        'INSERT INTO quiz_answers(id, attempt_id, term_id, correct, confidence, time_ms, question_type) VALUES(?, ?, ?, ?, ?, ?, ?)'
      );
      for (const a of data.quizAnswers) {
        try {
          ins.run(a.id, a.attempt_id, a.term_id, a.correct, a.confidence, a.time_ms, a.question_type);
        } catch {}
      }
    }
    if (data.studySessions) {
      const ins = db.prepare('INSERT INTO study_sessions(mode, seconds, taken_at) VALUES(?, ?, ?)');
      for (const s of data.studySessions) {
        try {
          ins.run(s.mode, s.seconds, s.taken_at);
        } catch {}
      }
    }
  });
  reset();
  return NextResponse.json({ ok: true });
}
