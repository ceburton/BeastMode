import 'server-only';
import { getDb } from './db';
import { todayISO } from './utils';

export interface DashboardStats {
  totalCards: number;
  mastered: number;
  learning: number;
  newCount: number;
  dueToday: number;
  studyStreakDays: number;
  studiedThisWeekS: number;
  studiedTodayS: number;
  accuracyByUnit: { unitId: number; unitName: string; correct: number; total: number; accuracy: number }[];
  weakAreas: { unitId: number; unitName: string; accuracy: number; total: number }[];
  recentAttempts: {
    id: number;
    mode: string;
    score: number;
    total: number;
    takenAt: string;
    durationS: number;
  }[];
}

export function dashboardStats(): DashboardStats {
  const db = getDb();
  const today = todayISO();

  const totalCards = (db.prepare('SELECT COUNT(*) AS n FROM terms').get() as { n: number }).n;
  const mastered = (
    db.prepare('SELECT COUNT(*) AS n FROM card_progress WHERE interval_days >= 21').get() as { n: number }
  ).n;
  const learning = (
    db
      .prepare('SELECT COUNT(*) AS n FROM card_progress WHERE interval_days > 0 AND interval_days < 21')
      .get() as { n: number }
  ).n;
  const newCount = totalCards - mastered - learning;

  const dueToday = (
    db
      .prepare(
        'SELECT COUNT(*) AS n FROM terms t LEFT JOIN card_progress cp ON cp.term_id = t.id WHERE cp.due_date IS NULL OR cp.due_date <= ?'
      )
      .get(today) as { n: number }
  ).n;

  // Accuracy by unit (across all quiz answers)
  const accRows = db
    .prepare(
      `
      SELECT t.unit_id AS unitId, u.name AS unitName,
             SUM(qa.correct) AS correct, COUNT(*) AS total
      FROM quiz_answers qa
      JOIN terms t ON t.id = qa.term_id
      JOIN units u ON u.id = t.unit_id
      GROUP BY t.unit_id
      ORDER BY t.unit_id
    `
    )
    .all() as { unitId: number; unitName: string; correct: number; total: number }[];

  const allUnits = db.prepare('SELECT id, name FROM units ORDER BY id').all() as { id: number; name: string }[];
  const accuracyByUnit = allUnits.map((u) => {
    const row = accRows.find((r) => r.unitId === u.id);
    const correct = row?.correct ?? 0;
    const total = row?.total ?? 0;
    return {
      unitId: u.id,
      unitName: u.name,
      correct,
      total,
      accuracy: total > 0 ? correct / total : 0,
    };
  });

  // Weak areas: lowest accuracy among units with at least 5 questions answered
  const weakAreas = accuracyByUnit
    .filter((u) => u.total >= 5)
    .sort((a, b) => a.accuracy - b.accuracy)
    .slice(0, 3)
    .map((u) => ({ unitId: u.unitId, unitName: u.unitName, accuracy: u.accuracy, total: u.total }));

  // Streak (consecutive days with at least one study session ending today or yesterday)
  const sessions = db
    .prepare(`SELECT date(taken_at) AS d, SUM(seconds) AS s FROM study_sessions GROUP BY date(taken_at) ORDER BY d DESC`)
    .all() as { d: string; s: number }[];

  let streak = 0;
  let cursor = new Date(today + 'T00:00:00Z');
  // Count today if today appears in sessions; otherwise, the streak still counts if yesterday was studied (allow today to be unstudied at the start of the day).
  const hasToday = sessions.some((s) => s.d === today);
  if (!hasToday) {
    cursor.setUTCDate(cursor.getUTCDate() - 1);
  }
  while (true) {
    const iso = cursor.toISOString().slice(0, 10);
    if (sessions.some((s) => s.d === iso)) {
      streak += 1;
      cursor.setUTCDate(cursor.getUTCDate() - 1);
    } else {
      break;
    }
  }

  // Studied this week
  const weekAgo = new Date(today + 'T00:00:00Z');
  weekAgo.setUTCDate(weekAgo.getUTCDate() - 6);
  const weekIso = weekAgo.toISOString().slice(0, 10);
  const studiedThisWeekS = (
    db
      .prepare(`SELECT COALESCE(SUM(seconds), 0) AS s FROM study_sessions WHERE date(taken_at) >= ?`)
      .get(weekIso) as { s: number }
  ).s;
  const studiedTodayS = (
    db
      .prepare(`SELECT COALESCE(SUM(seconds), 0) AS s FROM study_sessions WHERE date(taken_at) = ?`)
      .get(today) as { s: number }
  ).s;

  const recentAttempts = db
    .prepare(
      `SELECT id, mode, score, total, taken_at AS takenAt, duration_s AS durationS
       FROM quiz_attempts ORDER BY id DESC LIMIT 5`
    )
    .all() as DashboardStats['recentAttempts'];

  return {
    totalCards,
    mastered,
    learning,
    newCount,
    dueToday,
    studyStreakDays: streak,
    studiedThisWeekS,
    studiedTodayS,
    accuracyByUnit,
    weakAreas,
    recentAttempts,
  };
}

export function logStudySession(mode: string, seconds: number) {
  if (seconds < 5) return;
  const db = getDb();
  db.prepare('INSERT INTO study_sessions(mode, seconds, taken_at) VALUES(?, ?, ?)').run(
    mode,
    Math.round(seconds),
    new Date().toISOString()
  );
}

export function recordQuizAttempt(args: {
  mode: string;
  unitIds: number[];
  score: number;
  total: number;
  durationS: number;
  answers: { termId: string; correct: boolean; confidence: number | null; timeMs: number; questionType: string }[];
  logSession?: boolean;
}): number {
  const db = getDb();
  const insert = db.transaction(() => {
    const r = db
      .prepare(
        'INSERT INTO quiz_attempts(mode, unit_ids_json, score, total, duration_s, taken_at) VALUES(?, ?, ?, ?, ?, ?)'
      )
      .run(args.mode, JSON.stringify(args.unitIds), args.score, args.total, Math.round(args.durationS), new Date().toISOString());
    const attemptId = Number(r.lastInsertRowid);
    const stmt = db.prepare(
      'INSERT INTO quiz_answers(attempt_id, term_id, correct, confidence, time_ms, question_type) VALUES(?, ?, ?, ?, ?, ?)'
    );
    for (const a of args.answers) {
      stmt.run(attemptId, a.termId, a.correct ? 1 : 0, a.confidence, Math.round(a.timeMs), a.questionType);
    }
    return attemptId;
  });
  const attemptId = insert();
  if (args.logSession !== false) logStudySession(args.mode, args.durationS);
  return attemptId;
}

export function recordExamAttempt(args: {
  mcqScore: number;
  mcqTotal: number;
  frq1: string;
  frq2: string;
  frq1Id: string;
  frq2Id: string;
  perUnit: Record<number, { correct: number; total: number }>;
  durationS: number;
  answers: { termId: string; correct: boolean; timeMs: number; questionType: string }[];
}): number {
  const db = getDb();
  const r = db
    .prepare(
      `INSERT INTO exam_attempts(mcq_score, mcq_total, frq1, frq2, frq1_id, frq2_id, per_unit_json, duration_s, taken_at)
       VALUES(?, ?, ?, ?, ?, ?, ?, ?, ?)`
    )
    .run(
      args.mcqScore,
      args.mcqTotal,
      args.frq1,
      args.frq2,
      args.frq1Id,
      args.frq2Id,
      JSON.stringify(args.perUnit),
      Math.round(args.durationS),
      new Date().toISOString()
    );
  // Also record the MCQ portion as a quiz attempt for unified history
  recordQuizAttempt({
    mode: 'exam-mcq',
    unitIds: [],
    score: args.mcqScore,
    total: args.mcqTotal,
    durationS: args.durationS,
    answers: args.answers.map((a) => ({
      termId: a.termId,
      correct: a.correct,
      confidence: null,
      timeMs: a.timeMs,
      questionType: a.questionType,
    })),
    logSession: false,
  });
  logStudySession('exam', args.durationS);
  return Number(r.lastInsertRowid);
}
