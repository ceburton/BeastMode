import 'server-only';
import path from 'node:path';
import fs from 'node:fs';
import Database from 'better-sqlite3';

const DB_PATH = path.join(process.cwd(), 'data', 'beast.db');

declare global {
  // eslint-disable-next-line no-var
  var __beastDB: Database.Database | undefined;
}

function open(): Database.Database {
  if (!fs.existsSync(path.dirname(DB_PATH))) {
    fs.mkdirSync(path.dirname(DB_PATH), { recursive: true });
  }
  const db = new Database(DB_PATH);
  db.pragma('journal_mode = WAL');
  db.pragma('foreign_keys = ON');
  ensureSchema(db);
  return db;
}

export function getDb(): Database.Database {
  if (!global.__beastDB) {
    global.__beastDB = open();
  }
  return global.__beastDB;
}

export function ensureSchema(db: Database.Database) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS units (
      id INTEGER PRIMARY KEY,
      name TEXT NOT NULL,
      slug TEXT NOT NULL UNIQUE
    );
    CREATE TABLE IF NOT EXISTS topics (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      unit_id INTEGER NOT NULL REFERENCES units(id),
      name TEXT NOT NULL,
      position INTEGER NOT NULL DEFAULT 0,
      UNIQUE(unit_id, name)
    );
    CREATE TABLE IF NOT EXISTS terms (
      id TEXT PRIMARY KEY,
      topic_id INTEGER NOT NULL REFERENCES topics(id),
      unit_id INTEGER NOT NULL REFERENCES units(id),
      term TEXT NOT NULL,
      definition TEXT NOT NULL,
      mnemonic TEXT,
      examples_json TEXT,
      source TEXT,
      position INTEGER NOT NULL DEFAULT 0
    );
    CREATE INDEX IF NOT EXISTS idx_terms_topic ON terms(topic_id);
    CREATE INDEX IF NOT EXISTS idx_terms_unit ON terms(unit_id);

    CREATE TABLE IF NOT EXISTS card_progress (
      term_id TEXT PRIMARY KEY REFERENCES terms(id),
      interval_days REAL NOT NULL DEFAULT 0,
      ease REAL NOT NULL DEFAULT 2.5,
      reviews INTEGER NOT NULL DEFAULT 0,
      lapses INTEGER NOT NULL DEFAULT 0,
      due_date TEXT NOT NULL,
      last_review TEXT
    );
    CREATE INDEX IF NOT EXISTS idx_card_progress_due ON card_progress(due_date);

    CREATE TABLE IF NOT EXISTS quiz_attempts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      mode TEXT NOT NULL,
      unit_ids_json TEXT NOT NULL,
      score INTEGER NOT NULL,
      total INTEGER NOT NULL,
      duration_s INTEGER NOT NULL,
      taken_at TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS quiz_answers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      attempt_id INTEGER NOT NULL REFERENCES quiz_attempts(id) ON DELETE CASCADE,
      term_id TEXT NOT NULL,
      correct INTEGER NOT NULL,
      confidence INTEGER,
      time_ms INTEGER NOT NULL,
      question_type TEXT NOT NULL
    );
    CREATE INDEX IF NOT EXISTS idx_quiz_answers_attempt ON quiz_answers(attempt_id);
    CREATE INDEX IF NOT EXISTS idx_quiz_answers_term ON quiz_answers(term_id);

    CREATE TABLE IF NOT EXISTS exam_attempts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      mcq_score INTEGER NOT NULL,
      mcq_total INTEGER NOT NULL,
      frq1 TEXT NOT NULL,
      frq2 TEXT NOT NULL,
      frq1_id TEXT NOT NULL,
      frq2_id TEXT NOT NULL,
      per_unit_json TEXT NOT NULL,
      duration_s INTEGER NOT NULL,
      taken_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS study_sessions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      mode TEXT NOT NULL,
      seconds INTEGER NOT NULL,
      taken_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS match_best_times (
      unit_id INTEGER PRIMARY KEY REFERENCES units(id),
      seconds REAL NOT NULL,
      misses INTEGER NOT NULL DEFAULT 0,
      pairs INTEGER NOT NULL DEFAULT 0,
      taken_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS user_settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL
    );
  `);
}

export function setSetting(key: string, value: string) {
  getDb()
    .prepare('INSERT INTO user_settings(key, value) VALUES(?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value')
    .run(key, value);
}

export function getSetting(key: string): string | null {
  const row = getDb().prepare('SELECT value FROM user_settings WHERE key = ?').get(key) as { value: string } | undefined;
  return row?.value ?? null;
}
