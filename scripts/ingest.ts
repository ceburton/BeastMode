/**
 * One-time ingestion: parse `the Beast Review.md` into structured cards
 * and write them to data/beast.db (SQLite) + data/beast.json (inspection).
 *
 * Run: npm run ingest
 */
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import Database from 'better-sqlite3';

const ROOT = process.cwd();
const SOURCE_CANDIDATES = [
  path.join(ROOT, 'the_Beast_Review.md'),
  path.join(ROOT, 'the Beast Review.md'),
  path.join(ROOT, 'the-beast-review.md'),
];
const SOURCE = SOURCE_CANDIDATES.find((p) => fs.existsSync(p));
if (!SOURCE) {
  console.error('Source markdown not found. Looked for:', SOURCE_CANDIDATES);
  process.exit(1);
}
const DB_PATH = path.join(ROOT, 'data', 'beast.db');
const JSON_PATH = path.join(ROOT, 'data', 'beast.json');
fs.mkdirSync(path.dirname(DB_PATH), { recursive: true });

// ---- Unit + section mapping ---------------------------------------------------

const UNITS: { id: number; name: string; slug: string }[] = [
  { id: 1, name: 'Research Methods & Statistics', slug: 'research-methods' },
  { id: 2, name: 'Biological Bases of Behavior', slug: 'biological-bases' },
  { id: 3, name: 'Sensation & Perception', slug: 'sensation-perception' },
  { id: 4, name: 'Memory, Cognition & Language', slug: 'cognition' },
  { id: 5, name: 'Intelligence & Testing', slug: 'intelligence' },
  { id: 6, name: 'Development', slug: 'development' },
  { id: 7, name: 'Learning', slug: 'learning' },
  { id: 8, name: 'Motivation, Emotion & Stress', slug: 'motivation-emotion' },
  { id: 9, name: 'Social Psychology', slug: 'social' },
  { id: 10, name: 'Personality', slug: 'personality' },
  { id: 11, name: 'Abnormal Psychology', slug: 'abnormal' },
  { id: 12, name: 'Treatment of Disorders', slug: 'treatment' },
];

/**
 * For each major header in the source we map into (unitId, topicName).
 * Headers are matched case-insensitively against the cleaned line text
 * (longest match first to avoid false positives).
 */
const HEADER_RULES: { match: RegExp; unit: number; topic: string }[] = [
  // Unit 1
  { match: /^research and experiments$/i, unit: 1, topic: 'Research Basics' },
  { match: /^basic vocabulary:?$/i, unit: 1, topic: 'Research Basics' },
  { match: /^research designs$/i, unit: 1, topic: 'Research Designs' },
  { match: /^vocab unique to experiments:?$/i, unit: 1, topic: 'Experiments' },
  { match: /^other study types$/i, unit: 1, topic: 'Other Study Types' },
  { match: /^statistics$/i, unit: 1, topic: 'Statistics' },
  { match: /^additional vocabulary:?$/i, unit: 1, topic: 'Sampling & Bias' },

  // Unit 2
  { match: /^biological basis pillar$/i, unit: 2, topic: 'Heredity vs Environment' },
  { match: /^heredity vs environment$/i, unit: 2, topic: 'Heredity vs Environment' },
  { match: /^nervous system$/i, unit: 2, topic: 'Nervous System' },
  { match: /^neuron and neural firing/i, unit: 2, topic: 'Neurons & Neural Firing' },
  { match: /^the brain$/i, unit: 2, topic: 'The Brain' },
  { match: /^diseases & disorders to know$/i, unit: 2, topic: 'Brain Diseases & Disorders' },
  { match: /^sleep$/i, unit: 2, topic: 'Sleep' },

  // Unit 3
  { match: /^sensation$/i, unit: 3, topic: 'Sensation' },
  { match: /^intro vocab$/i, unit: 3, topic: 'Sensation' },
  { match: /^perception$/i, unit: 3, topic: 'Perception' },
  { match: /^cognition pillar$/i, unit: 3, topic: 'Perception' },

  // Unit 4
  { match: /^thinking & problem solving$/i, unit: 4, topic: 'Thinking & Problem Solving' },
  { match: /^memory$/i, unit: 4, topic: 'Memory' },
  { match: /^encoding:/i, unit: 4, topic: 'Memory: Encoding' },
  { match: /^storage:/i, unit: 4, topic: 'Memory: Storage' },
  { match: /^other odd types of memory$/i, unit: 4, topic: 'Memory: Storage' },
  { match: /^memory storage$/i, unit: 4, topic: 'Memory: Storage' },
  { match: /^retrieval:/i, unit: 4, topic: 'Memory: Retrieval' },
  { match: /^language$/i, unit: 4, topic: 'Language' },

  // Unit 5
  { match: /^intelligence & achievement$/i, unit: 5, topic: 'Intelligence Theories' },
  { match: /^historical issues with intelligence testing$/i, unit: 5, topic: 'Intelligence Testing Issues' },

  // Unit 6
  { match: /^development and learning pillar$/i, unit: 6, topic: 'Development Themes' },
  { match: /^development$/i, unit: 6, topic: 'Development Themes' },
  { match: /^"3 thematic issues"/i, unit: 6, topic: 'Development Themes' },
  { match: /^physical development$/i, unit: 6, topic: 'Physical Development' },
  { match: /^cognitive development$/i, unit: 6, topic: 'Cognitive Development' },
  { match: /^socioemotional development$/i, unit: 6, topic: 'Socioemotional Development' },

  // Unit 7
  { match: /^learning$/i, unit: 7, topic: 'Learning Basics' },
  { match: /^classical conditioning:/i, unit: 7, topic: 'Classical Conditioning' },
  { match: /^operant conditioning:/i, unit: 7, topic: 'Operant Conditioning' },
  { match: /^misc learning types$/i, unit: 7, topic: 'Social & Other Learning' },

  // Unit 8
  { match: /^motivation$/i, unit: 8, topic: 'Motivation' },
  { match: /^theories:?$/i, unit: 8, topic: 'Motivation' },
  { match: /^hunger$/i, unit: 8, topic: 'Hunger' },
  { match: /^emotion$/i, unit: 8, topic: 'Emotion' },
  { match: /^biological explanation/i, unit: 8, topic: 'Emotion' },
  { match: /^mental and physical health pillar$/i, unit: 8, topic: 'Health & Stress' },
  { match: /^health \/ stress$/i, unit: 8, topic: 'Health & Stress' },
  { match: /^positive psychology$/i, unit: 8, topic: 'Positive Psychology' },

  // Unit 9
  { match: /^social and personality pillar$/i, unit: 9, topic: 'Attributions & Perceptions' },
  { match: /^social psych /i, unit: 9, topic: 'Attributions & Perceptions' },
  { match: /^attributions and perceptions/i, unit: 9, topic: 'Attributions & Perceptions' },
  { match: /^attitude formation and change:/i, unit: 9, topic: 'Attitudes' },
  { match: /^social situations$/i, unit: 9, topic: 'Social Situations' },

  // Unit 10
  { match: /^personality$/i, unit: 10, topic: 'Psychodynamic & Defense' },
  { match: /^psychodynamic explanation:/i, unit: 10, topic: 'Psychodynamic & Defense' },
  { match: /^defense mechanisms /i, unit: 10, topic: 'Defense Mechanisms' },
  { match: /^how do we "test" this personality approach\?/i, unit: 10, topic: 'Personality Tests' },
  { match: /^trait explanation:/i, unit: 10, topic: 'Trait Theory' },
  { match: /^humanistic explanation:/i, unit: 10, topic: 'Humanistic' },
  { match: /^social-cognitive explanation:/i, unit: 10, topic: 'Social-Cognitive' },

  // Unit 11
  { match: /^explaining \/ classifying disorders$/i, unit: 11, topic: 'Classifying Disorders' },
  { match: /^7 perspectives to explaining \/ treating$/i, unit: 11, topic: 'Perspectives on Disorders' },
  { match: /^interaction models to explain disorders$/i, unit: 11, topic: 'Classifying Disorders' },
  { match: /^neurodevelopmental disorders:/i, unit: 11, topic: 'Neurodevelopmental Disorders' },
  { match: /^feeding and eating disorders:/i, unit: 11, topic: 'Eating Disorders' },
  { match: /^causes of eating disorders$/i, unit: 11, topic: 'Eating Disorders' },
  { match: /^depressive disorders$/i, unit: 11, topic: 'Mood Disorders' },
  { match: /^bipolar disorders$/i, unit: 11, topic: 'Mood Disorders' },
  { match: /^causes of depressive and bipolar disorders$/i, unit: 11, topic: 'Mood Disorders' },
  { match: /^schizophrenia$/i, unit: 11, topic: 'Schizophrenia' },
  { match: /^causes of schizophrenia$/i, unit: 11, topic: 'Schizophrenia' },
  { match: /^anxiety disorders$/i, unit: 11, topic: 'Anxiety Disorders' },
  { match: /^causes of anxiety disorders:/i, unit: 11, topic: 'Anxiety Disorders' },
  { match: /^dissociative disorders$/i, unit: 11, topic: 'Dissociative Disorders' },
  { match: /^causes of dissociative disorders$/i, unit: 11, topic: 'Dissociative Disorders' },
  { match: /^obsessive compulsive disorders$/i, unit: 11, topic: 'OCD & Related' },
  { match: /^causes of obess\. compulsive disorders$/i, unit: 11, topic: 'OCD & Related' },
  { match: /^trauma and stress related disorders$/i, unit: 11, topic: 'Trauma & Stress Disorders' },
  { match: /^personality disorders$/i, unit: 11, topic: 'Personality Disorders' },
  { match: /^cluster a:/i, unit: 11, topic: 'Personality Disorders' },
  { match: /^cluster b/i, unit: 11, topic: 'Personality Disorders' },
  { match: /^cluster c/i, unit: 11, topic: 'Personality Disorders' },

  // Unit 12
  { match: /^treatment of disorders$/i, unit: 12, topic: 'Therapy Ethics & Overview' },
  { match: /^ethics of therapy from the apa$/i, unit: 12, topic: 'Therapy Ethics & Overview' },
  { match: /^psychodynamic perspective:/i, unit: 12, topic: 'Psychodynamic Therapy' },
  { match: /^biological perspective:/i, unit: 12, topic: 'Biological Therapy' },
  { match: /^humanistic perspective:/i, unit: 12, topic: 'Humanistic Therapy' },
  { match: /^combined perspectives/i, unit: 12, topic: 'Combined Therapies' },
  { match: /^other techniques:?$/i, unit: 12, topic: 'Other Therapies' },
];

// Subsection cues that change topic without being top-level
const SUBSECTION_RULES: { match: RegExp; topic: string }[] = [
  { match: /^principles of operant cond:?$/i, topic: 'Operant Conditioning' },
  { match: /^law of effect/i, topic: 'Operant Conditioning' },
  { match: /^visual system:?$/i, topic: 'Vision' },
  { match: /^visual system vocab:?$/i, topic: 'Vision' },
  { match: /^theories of color vision:?$/i, topic: 'Vision' },
  { match: /^auditory system:?$/i, topic: 'Hearing' },
  { match: /^properties of sound:?$/i, topic: 'Hearing' },
  { match: /^theories of hearing:/i, topic: 'Hearing' },
  { match: /^other hearing stuff:?$/i, topic: 'Hearing' },
  { match: /^other senses:?$/i, topic: 'Other Senses' },
  { match: /^gestalt psychology:/i, topic: 'Gestalt & Perception' },
  { match: /^gestalt principles:?$/i, topic: 'Gestalt & Perception' },
  { match: /^binocular depth cues:?/i, topic: 'Depth & Cues' },
  { match: /^monocular depth cues/i, topic: 'Depth & Cues' },
  { match: /^prenatal development:?$/i, topic: 'Physical Development' },
  { match: /^puberty/i, topic: 'Physical Development' },
  { match: /^adulthood/i, topic: 'Physical Development' },
  { match: /^jean piaget/i, topic: 'Piaget & Vygotsky' },
  { match: /^vygotsky/i, topic: 'Piaget & Vygotsky' },
  { match: /^erikson/i, topic: "Erikson's Stages" },
  { match: /^marcia/i, topic: 'Marcia & Identity' },
  { match: /^ecological systems theory:?$/i, topic: 'Bronfenbrenner' },
  { match: /^biology of hunger:?$/i, topic: 'Hunger' },
  { match: /^psych of hunger:?$/i, topic: 'Hunger' },
  { match: /^historical theories/i, topic: 'Emotion' },
  { match: /^general adaptation syndrome:?/i, topic: 'Health & Stress' },
  { match: /^dream theories:?$/i, topic: 'Sleep' },
  { match: /^why is sleep necessary$/i, topic: 'Sleep' },
  { match: /^sleep disorders$/i, topic: 'Sleep' },
  { match: /^psychoactive drugs:?$/i, topic: 'Drugs' },
];

// ---- Source cleaning ---------------------------------------------------------

function cleanLine(raw: string): string {
  return raw
    .replace(/!\[[^\]]*\]\[[^\]]*\]/g, '')
    .replace(/!\[[^\]]*\]\([^)]*\)/g, '')
    .replace(/\[image\d+\]/gi, '')
    .replace(/\[[^\]]+\]\[image\d+\]/gi, '')
    .replace(/\\([\-=!+#<>*_()\[\]~`'"])/g, '$1')
    .replace(/–|—/g, '-')
    .replace(/‘|’/g, "'")
    .replace(/“|”/g, '"')
    .replace(/ /g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function stripBold(s: string): string {
  // Remove **...** wrappers that span the whole line or pieces of it
  let out = s.replace(/\*\*/g, '');
  return out.trim();
}

interface RawLine {
  text: string;
  isBullet: boolean;
  isHeader: boolean;
  raw: string;
}

function classify(rawLine: string): RawLine | null {
  const trimmed = rawLine.trimEnd();
  if (!trimmed.trim()) return null;

  // Bullet detection (markdown lists in source use "* ")
  const bulletMatch = /^\s*[\*\-]\s+(.*)$/.exec(trimmed);
  let body: string;
  let isBullet: boolean;
  if (bulletMatch) {
    body = bulletMatch[1];
    isBullet = true;
  } else {
    body = trimmed;
    isBullet = false;
  }

  body = stripBold(body);
  body = cleanLine(body);
  if (!body) return null;
  // skip pure image leftovers
  if (/^!?\[\s*\]\(\)\s*$/.test(body)) return null;

  // Header heuristic: not a bullet AND original line was wholly bold (or nearly) AND not too long
  const wasBold = /^\s*\*\*.+\*\*\s*$/.test(rawLine.trim()) || /^\s*\*\*.+\*\*\s*$/m.test(rawLine.trim());
  const isHeader = !isBullet && body.length > 0 && body.length < 100;

  return { text: body, isBullet, isHeader, raw: trimmed };
}

// ---- Term extraction ---------------------------------------------------------

const MNEMONIC_HINTS = [
  /\(([^()]{3,90})\)\s*$/, // trailing parenthetical
];

const KNOWN_MNEMONIC_PHRASES = [
  /glutes excite/i,
  /hippo on campus/i,
  /broca/i,
  /wernicke/i,
  /turns you into a gremlin/i,
  /walking a tightrope/i,
  /betta be awake/i,
  /toilet/i,
  /angel on your shoulder/i,
  /devil on your shoulder/i,
  /it'?s you/i,
];

function extractMnemonic(definition: string): { def: string; mnemonic: string | null } {
  // Look for trailing parenthetical that "feels like" a mnemonic
  const paren = definition.match(/^(.*?)\s*\(([^()]{3,140})\)\s*$/);
  if (paren) {
    const inside = paren[2].trim();
    const looksLikeMnemonic =
      KNOWN_MNEMONIC_PHRASES.some((rx) => rx.test(inside)) ||
      /!$/.test(inside) ||
      /^if you\b/i.test(inside) ||
      /\byou'?d remember\b/i.test(inside) ||
      /^think\b/i.test(inside) ||
      /\bremember\b/i.test(inside);
    if (looksLikeMnemonic) {
      return { def: paren[1].trim(), mnemonic: inside };
    }
  }
  return { def: definition.trim(), mnemonic: null };
}

function looseSplit(line: string): { term: string; def: string } | null {
  // Skip lines that are pure section headers
  if (/^[A-Z\s&\/]+:\s*$/.test(line)) return null;
  // Try colon split first (only first occurrence), then em-dash, then ' - ', then ' = '
  const splitters: { rx: RegExp }[] = [
    { rx: /^([A-Z][^:]{1,60}):\s+(.+)$/ },
    { rx: /^([A-Z][^-=]{1,60})\s+-\s+(.+)$/ },
    { rx: /^([A-Z][^–=]{1,60})\s+–\s+(.+)$/ },
    { rx: /^([A-Z][^=:]{1,60})\s+=\s+(.+)$/ },
  ];
  for (const { rx } of splitters) {
    const m = rx.exec(line);
    if (m) {
      let term = m[1].trim().replace(/[:\s]+$/, '');
      const def = m[2].trim();
      // reject term if it still contains a sentence-ish marker
      if (/[.;]/.test(term)) continue;
      if (term.length < 2 || term.length > 60) continue;
      if (def.length < 4) continue;
      return { term, def };
    }
  }
  return null;
}

interface ParsedTerm {
  term: string;
  definition: string;
  mnemonic: string | null;
  unitId: number;
  topicName: string;
  source: string;
}

function parse(text: string): ParsedTerm[] {
  const lines = text.split(/\r?\n/);
  const out: ParsedTerm[] = [];
  let unitId = 1;
  let topicName = 'Research Basics';
  let skip = false;

  for (const raw of lines) {
    const cl = classify(raw);
    if (!cl) continue;
    // Stop ingestion at AP Exam Formatting trailer
    if (/ap exam formatting/i.test(cl.text)) skip = true;
    if (skip) continue;

    // Try to update unit/topic when we see a header line
    if (!cl.isBullet) {
      const lower = cl.text.toLowerCase();
      const headerHit = HEADER_RULES.find((r) => r.match.test(cl.text));
      if (headerHit) {
        unitId = headerHit.unit;
        topicName = headerHit.topic;
        continue;
      }
      const subHit = SUBSECTION_RULES.find((r) => r.match.test(cl.text));
      if (subHit) {
        topicName = subHit.topic;
        continue;
      }
      // Try a term split on a non-bullet too (some lines aren't bulleted)
      const split = looseSplit(cl.text);
      if (split) {
        const { def: cleaned, mnemonic } = extractMnemonic(split.def);
        out.push({
          term: split.term,
          definition: cleaned,
          mnemonic,
          unitId,
          topicName,
          source: cl.text,
        });
      }
      continue;
    }

    // Bullets: check subsection cues first
    const subHit = SUBSECTION_RULES.find((r) => r.match.test(cl.text));
    if (subHit) {
      topicName = subHit.topic;
      // fall through to also try term-extracting from the same line
    }

    const split = looseSplit(cl.text);
    if (!split) continue;

    const { def: cleaned, mnemonic } = extractMnemonic(split.def);
    if (cleaned.length < 4) continue;

    out.push({
      term: split.term,
      definition: cleaned,
      mnemonic,
      unitId,
      topicName,
      source: cl.text,
    });
  }

  // dedupe by (unit, term lowercased) — keep first
  const seen = new Set<string>();
  const dedup = out.filter((c) => {
    const key = `${c.unitId}::${c.term.toLowerCase()}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  return dedup;
}

// ---- Disorder perspective table — special handling --------------------------

function injectPerspectiveTable(): ParsedTerm[] {
  return [
    {
      term: 'Biological Perspective on Disorders',
      definition: 'Genes cause changes in neurotransmitters and brain. Treated with medication and surgical techniques.',
      mnemonic: null,
      unitId: 11,
      topicName: 'Perspectives on Disorders',
      source: 'Disorder perspectives table',
    },
    {
      term: 'Evolutionary Perspective on Disorders',
      definition: 'Maladaptive traits explained by past survival or reproductive advantage.',
      mnemonic: null,
      unitId: 11,
      topicName: 'Perspectives on Disorders',
      source: 'Disorder perspectives table',
    },
    {
      term: 'Cognitive Perspective on Disorders',
      definition: 'Maladaptive thinking and emotions cause disorders. Treated with cognitive restructuring.',
      mnemonic: null,
      unitId: 11,
      topicName: 'Perspectives on Disorders',
      source: 'Disorder perspectives table',
    },
    {
      term: 'Behavioral Perspective on Disorders',
      definition: 'Maladaptive learned associations cause disorders. Treated with applied behavior analysis.',
      mnemonic: null,
      unitId: 11,
      topicName: 'Perspectives on Disorders',
      source: 'Disorder perspectives table',
    },
    {
      term: 'Psychodynamic Perspective on Disorders',
      definition: 'Unconscious thoughts and behaviors from childhood cause disorders. Treated with free association and dream interpretation.',
      mnemonic: null,
      unitId: 11,
      topicName: 'Perspectives on Disorders',
      source: 'Disorder perspectives table',
    },
    {
      term: 'Humanistic Perspective on Disorders',
      definition: 'Lack of social support and not fulfilling potential. Treated with unconditional positive regard and client-centered therapy.',
      mnemonic: null,
      unitId: 11,
      topicName: 'Perspectives on Disorders',
      source: 'Disorder perspectives table',
    },
    {
      term: 'Sociocultural Perspective on Disorders',
      definition: 'Maladaptive social and cultural dynamics cause disorders.',
      mnemonic: null,
      unitId: 11,
      topicName: 'Perspectives on Disorders',
      source: 'Disorder perspectives table',
    },
  ];
}

// ---- DB write ---------------------------------------------------------------

function termId(unitId: number, term: string): string {
  return crypto.createHash('sha1').update(`u${unitId}:${term.toLowerCase()}`).digest('hex').slice(0, 16);
}

function writeDb(parsed: ParsedTerm[]) {
  if (fs.existsSync(DB_PATH)) fs.rmSync(DB_PATH);
  const db = new Database(DB_PATH);
  db.pragma('journal_mode = WAL');
  db.pragma('foreign_keys = ON');
  db.exec(`
    CREATE TABLE units (id INTEGER PRIMARY KEY, name TEXT NOT NULL, slug TEXT NOT NULL UNIQUE);
    CREATE TABLE topics (id INTEGER PRIMARY KEY AUTOINCREMENT, unit_id INTEGER NOT NULL REFERENCES units(id),
                         name TEXT NOT NULL, position INTEGER NOT NULL DEFAULT 0, UNIQUE(unit_id, name));
    CREATE TABLE terms (id TEXT PRIMARY KEY, topic_id INTEGER NOT NULL REFERENCES topics(id),
                         unit_id INTEGER NOT NULL, term TEXT NOT NULL, definition TEXT NOT NULL,
                         mnemonic TEXT, examples_json TEXT, source TEXT,
                         position INTEGER NOT NULL DEFAULT 0);
    CREATE INDEX idx_terms_topic ON terms(topic_id);
    CREATE INDEX idx_terms_unit ON terms(unit_id);

    CREATE TABLE card_progress (term_id TEXT PRIMARY KEY REFERENCES terms(id),
                                 interval_days REAL NOT NULL DEFAULT 0,
                                 ease REAL NOT NULL DEFAULT 2.5,
                                 reviews INTEGER NOT NULL DEFAULT 0,
                                 lapses INTEGER NOT NULL DEFAULT 0,
                                 due_date TEXT NOT NULL,
                                 last_review TEXT);
    CREATE INDEX idx_card_progress_due ON card_progress(due_date);

    CREATE TABLE quiz_attempts (id INTEGER PRIMARY KEY AUTOINCREMENT, mode TEXT NOT NULL,
                                  unit_ids_json TEXT NOT NULL, score INTEGER NOT NULL, total INTEGER NOT NULL,
                                  duration_s INTEGER NOT NULL, taken_at TEXT NOT NULL);
    CREATE TABLE quiz_answers (id INTEGER PRIMARY KEY AUTOINCREMENT,
                                 attempt_id INTEGER NOT NULL REFERENCES quiz_attempts(id) ON DELETE CASCADE,
                                 term_id TEXT NOT NULL, correct INTEGER NOT NULL,
                                 confidence INTEGER, time_ms INTEGER NOT NULL, question_type TEXT NOT NULL);
    CREATE INDEX idx_quiz_answers_attempt ON quiz_answers(attempt_id);
    CREATE INDEX idx_quiz_answers_term ON quiz_answers(term_id);

    CREATE TABLE exam_attempts (id INTEGER PRIMARY KEY AUTOINCREMENT,
                                  mcq_score INTEGER NOT NULL, mcq_total INTEGER NOT NULL,
                                  frq1 TEXT NOT NULL, frq2 TEXT NOT NULL,
                                  frq1_id TEXT NOT NULL, frq2_id TEXT NOT NULL,
                                  per_unit_json TEXT NOT NULL, duration_s INTEGER NOT NULL,
                                  taken_at TEXT NOT NULL);

    CREATE TABLE study_sessions (id INTEGER PRIMARY KEY AUTOINCREMENT, mode TEXT NOT NULL,
                                   seconds INTEGER NOT NULL, taken_at TEXT NOT NULL);

    CREATE TABLE match_best_times (unit_id INTEGER PRIMARY KEY REFERENCES units(id),
                                   seconds REAL NOT NULL, misses INTEGER NOT NULL DEFAULT 0,
                                   pairs INTEGER NOT NULL DEFAULT 0,
                                   taken_at TEXT NOT NULL);

    CREATE TABLE user_settings (key TEXT PRIMARY KEY, value TEXT NOT NULL);
  `);

  const insertUnit = db.prepare('INSERT INTO units(id, name, slug) VALUES(?, ?, ?)');
  for (const u of UNITS) insertUnit.run(u.id, u.name, u.slug);

  const getOrInsertTopic = db.transaction((unitId: number, name: string, position: number): number => {
    const row = db.prepare('SELECT id FROM topics WHERE unit_id = ? AND name = ?').get(unitId, name) as
      | { id: number }
      | undefined;
    if (row) return row.id;
    const r = db.prepare('INSERT INTO topics(unit_id, name, position) VALUES(?, ?, ?)').run(unitId, name, position);
    return Number(r.lastInsertRowid);
  });

  const insertTerm = db.prepare(
    'INSERT INTO terms(id, topic_id, unit_id, term, definition, mnemonic, examples_json, source, position) VALUES(?, ?, ?, ?, ?, ?, ?, ?, ?)'
  );

  let topicCounter: Record<string, number> = {};
  let termCounter: Record<number, number> = {};
  let written = 0;
  const writeAll = db.transaction(() => {
    for (const p of parsed) {
      const tKey = `${p.unitId}::${p.topicName}`;
      const pos = topicCounter[tKey] ?? Object.keys(topicCounter).length;
      topicCounter[tKey] = pos;
      const topicId = getOrInsertTopic(p.unitId, p.topicName, pos);
      const id = termId(p.unitId, p.term);
      const cardPos = (termCounter[topicId] = (termCounter[topicId] ?? 0) + 1);
      try {
        insertTerm.run(
          id,
          topicId,
          p.unitId,
          p.term,
          p.definition,
          p.mnemonic,
          JSON.stringify([]),
          p.source,
          cardPos
        );
        written++;
      } catch {
        // duplicate term id (rare) — skip
      }
    }
  });
  writeAll();

  return { db, written };
}

// ---- Run --------------------------------------------------------------------

function main() {
  const text = fs.readFileSync(SOURCE!, 'utf-8');
  console.log(`Reading: ${SOURCE}`);
  console.log(`Source: ${text.length} chars, ${text.split(/\r?\n/).length} lines`);

  const parsed = parse(text).concat(injectPerspectiveTable());

  const { written } = writeDb(parsed);
  fs.writeFileSync(JSON_PATH, JSON.stringify(parsed, null, 2));

  // Per-unit counts
  const counts: Record<number, number> = {};
  for (const c of parsed) counts[c.unitId] = (counts[c.unitId] || 0) + 1;
  console.log('\nIngest complete.');
  console.log('---------------------------------');
  console.log(`Wrote ${written} cards to ${path.relative(ROOT, DB_PATH)}`);
  console.log(`Wrote inspectable JSON to ${path.relative(ROOT, JSON_PATH)}`);
  console.log('Per-unit:');
  for (const u of UNITS) {
    const n = counts[u.id] || 0;
    const bar = '#'.repeat(Math.min(40, n));
    console.log(`  ${String(u.id).padStart(2, ' ')}. ${u.name.padEnd(36, ' ')} ${String(n).padStart(3, ' ')} ${bar}`);
  }
  const total = Object.values(counts).reduce((a, b) => a + b, 0);
  console.log(`  Total cards: ${total}`);
  const withMnemonics = parsed.filter((p) => p.mnemonic).length;
  console.log(`  With mnemonics: ${withMnemonics}`);
}

main();
