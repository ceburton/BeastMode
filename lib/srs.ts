import 'server-only';
import { getDb } from './db';
import { todayISO, nowISO } from './utils';
import type { Grade, Term } from './types';

const MIN_EASE = 1.3;
const MAX_EASE = 3.0;
const MAX_INTERVAL = 180;
const FIRST_GOOD_INTERVAL = 1; // days
const SECOND_GOOD_INTERVAL = 6;

export interface DueCard {
  term: Term;
  intervalDays: number;
  ease: number;
  reviews: number;
  lapses: number;
  dueDate: string;
  isNew: boolean;
}

function addDays(iso: string, days: number): string {
  const d = new Date(iso);
  d.setUTCDate(d.getUTCDate() + Math.round(days));
  return d.toISOString().slice(0, 10);
}

export function nextSchedule(
  current: { intervalDays: number; ease: number; reviews: number; lapses: number },
  grade: Grade
): { intervalDays: number; ease: number; lapsesDelta: number } {
  let { intervalDays, ease, reviews } = current;
  let lapsesDelta = 0;

  switch (grade) {
    case 'again': {
      intervalDays = 0; // due today (treat as next session)
      ease = Math.max(MIN_EASE, ease - 0.2);
      lapsesDelta = 1;
      break;
    }
    case 'hard': {
      ease = Math.max(MIN_EASE, ease - 0.15);
      intervalDays = reviews === 0 ? 1 : Math.min(MAX_INTERVAL, Math.max(1, intervalDays * 1.2));
      break;
    }
    case 'good': {
      if (reviews === 0) intervalDays = FIRST_GOOD_INTERVAL;
      else if (reviews === 1) intervalDays = SECOND_GOOD_INTERVAL;
      else intervalDays = Math.min(MAX_INTERVAL, intervalDays * ease);
      break;
    }
    case 'easy': {
      ease = Math.min(MAX_EASE, ease + 0.15);
      if (reviews === 0) intervalDays = SECOND_GOOD_INTERVAL;
      else intervalDays = Math.min(MAX_INTERVAL, intervalDays * ease * 1.3);
      break;
    }
  }

  return { intervalDays, ease, lapsesDelta };
}

export function gradeCard(termId: string, grade: Grade) {
  const db = getDb();
  const today = todayISO();

  const existing = db
    .prepare('SELECT interval_days, ease, reviews, lapses FROM card_progress WHERE term_id = ?')
    .get(termId) as
    | { interval_days: number; ease: number; reviews: number; lapses: number }
    | undefined;

  const current = existing ?? { interval_days: 0, ease: 2.5, reviews: 0, lapses: 0 };
  const { intervalDays, ease, lapsesDelta } = nextSchedule(
    {
      intervalDays: current.interval_days,
      ease: current.ease,
      reviews: current.reviews,
      lapses: current.lapses,
    },
    grade
  );

  const newReviews = current.reviews + 1;
  const newLapses = current.lapses + lapsesDelta;
  const dueDate = addDays(today, intervalDays);

  if (existing) {
    db.prepare(
      `UPDATE card_progress
       SET interval_days = ?, ease = ?, reviews = ?, lapses = ?, due_date = ?, last_review = ?
       WHERE term_id = ?`
    ).run(intervalDays, ease, newReviews, newLapses, dueDate, nowISO(), termId);
  } else {
    db.prepare(
      `INSERT INTO card_progress(term_id, interval_days, ease, reviews, lapses, due_date, last_review)
       VALUES(?, ?, ?, ?, ?, ?, ?)`
    ).run(termId, intervalDays, ease, newReviews, newLapses, dueDate, nowISO());
  }
}

export interface DeckFilter {
  unitIds?: number[];
  scope: 'due' | 'all' | 'new' | 'lapsed';
  limit?: number;
}

export function getDeck(filter: DeckFilter): DueCard[] {
  const db = getDb();
  const today = todayISO();
  const limit = filter.limit ?? 200;
  const params: (string | number)[] = [];

  let sql = `
    SELECT t.id AS termId, t.term, t.definition, t.mnemonic, t.unit_id AS unitId,
           t.topic_id AS topicId, u.name AS unitName, tp.name AS topicName,
           t.source AS source,
           cp.interval_days AS intervalDays, cp.ease AS ease,
           cp.reviews AS reviews, cp.lapses AS lapses,
           cp.due_date AS dueDate
    FROM terms t
    JOIN topics tp ON tp.id = t.topic_id
    JOIN units u ON u.id = t.unit_id
    LEFT JOIN card_progress cp ON cp.term_id = t.id
    WHERE 1=1
  `;

  if (filter.unitIds && filter.unitIds.length) {
    sql += ` AND t.unit_id IN (${filter.unitIds.map(() => '?').join(',')})`;
    params.push(...filter.unitIds);
  }

  switch (filter.scope) {
    case 'due':
      sql += ` AND (cp.due_date IS NULL OR cp.due_date <= ?)`;
      params.push(today);
      break;
    case 'new':
      sql += ` AND cp.term_id IS NULL`;
      break;
    case 'lapsed':
      sql += ` AND cp.lapses > 0`;
      break;
    case 'all':
      break;
  }

  sql += ` ORDER BY
    CASE WHEN cp.due_date IS NULL THEN 1 ELSE 0 END ASC,
    cp.due_date ASC,
    t.position ASC
    LIMIT ?`;
  params.push(limit);

  const rows = db.prepare(sql).all(...params) as Array<{
    termId: string;
    term: string;
    definition: string;
    mnemonic: string | null;
    unitId: number;
    topicId: number;
    unitName: string;
    topicName: string;
    source: string | null;
    intervalDays: number | null;
    ease: number | null;
    reviews: number | null;
    lapses: number | null;
    dueDate: string | null;
  }>;

  return rows.map((r) => ({
    term: {
      id: r.termId,
      topicId: r.topicId,
      unitId: r.unitId,
      unitName: r.unitName,
      topicName: r.topicName,
      term: r.term,
      definition: r.definition,
      mnemonic: r.mnemonic,
      source: r.source ?? '',
    },
    intervalDays: r.intervalDays ?? 0,
    ease: r.ease ?? 2.5,
    reviews: r.reviews ?? 0,
    lapses: r.lapses ?? 0,
    dueDate: r.dueDate ?? today,
    isNew: r.intervalDays === null,
  }));
}

export function dueCount(unitIds?: number[]): number {
  const db = getDb();
  const today = todayISO();
  const params: (string | number)[] = [];
  let sql = `
    SELECT COUNT(*) AS n
    FROM terms t
    LEFT JOIN card_progress cp ON cp.term_id = t.id
    WHERE (cp.due_date IS NULL OR cp.due_date <= ?)
  `;
  params.push(today);
  if (unitIds && unitIds.length) {
    sql += ` AND t.unit_id IN (${unitIds.map(() => '?').join(',')})`;
    params.push(...unitIds);
  }
  const row = db.prepare(sql).get(...params) as { n: number };
  return row.n;
}

export function masteryCounts(): { mastered: number; learning: number; new: number; total: number } {
  const db = getDb();
  const total = (db.prepare('SELECT COUNT(*) AS n FROM terms').get() as { n: number }).n;
  const mastered = (
    db.prepare('SELECT COUNT(*) AS n FROM card_progress WHERE interval_days >= 21').get() as {
      n: number;
    }
  ).n;
  const learning = (
    db
      .prepare('SELECT COUNT(*) AS n FROM card_progress WHERE interval_days > 0 AND interval_days < 21')
      .get() as { n: number }
  ).n;
  const newCount = total - mastered - learning;
  return { mastered, learning, new: newCount, total };
}
