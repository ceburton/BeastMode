import 'server-only';
import { getDb } from './db';
import type { Term } from './types';

export interface UnitWithTopics {
  id: number;
  name: string;
  slug: string;
  topics: { id: number; name: string; terms: Term[] }[];
}

export function getAllContent(): UnitWithTopics[] {
  const db = getDb();
  const units = db.prepare('SELECT id, name, slug FROM units ORDER BY id').all() as {
    id: number;
    name: string;
    slug: string;
  }[];
  const out: UnitWithTopics[] = [];
  for (const u of units) {
    const topics = db
      .prepare('SELECT id, name FROM topics WHERE unit_id = ? ORDER BY position, id')
      .all(u.id) as { id: number; name: string }[];
    const tt = topics.map((t) => {
      const terms = db
        .prepare(
          `SELECT id, term, definition, mnemonic, source, unit_id AS unitId, topic_id AS topicId
           FROM terms WHERE topic_id = ? ORDER BY position, term`
        )
        .all(t.id) as Array<{
        id: string;
        term: string;
        definition: string;
        mnemonic: string | null;
        source: string | null;
        unitId: number;
        topicId: number;
      }>;
      const mapped: Term[] = terms.map((tt) => ({
        id: tt.id,
        topicId: tt.topicId,
        unitId: tt.unitId,
        unitName: u.name,
        topicName: t.name,
        term: tt.term,
        definition: tt.definition,
        mnemonic: tt.mnemonic,
        source: tt.source ?? '',
      }));
      return { id: t.id, name: t.name, terms: mapped };
    });
    out.push({ id: u.id, name: u.name, slug: u.slug, topics: tt });
  }
  return out;
}

export function getAllTermsFlat(): Term[] {
  const db = getDb();
  const rows = db
    .prepare(
      `SELECT t.id, t.term, t.definition, t.mnemonic, t.source, t.unit_id AS unitId, t.topic_id AS topicId,
              u.name AS unitName, tp.name AS topicName
       FROM terms t JOIN units u ON u.id = t.unit_id JOIN topics tp ON tp.id = t.topic_id
       ORDER BY t.unit_id, tp.position, t.position, t.term`
    )
    .all() as Array<{
    id: string;
    term: string;
    definition: string;
    mnemonic: string | null;
    source: string | null;
    unitId: number;
    topicId: number;
    unitName: string;
    topicName: string;
  }>;
  return rows.map((r) => ({
    id: r.id,
    topicId: r.topicId,
    unitId: r.unitId,
    unitName: r.unitName,
    topicName: r.topicName,
    term: r.term,
    definition: r.definition,
    mnemonic: r.mnemonic,
    source: r.source ?? '',
  }));
}

export function getMissedTermsFromAttempt(attemptId: number): Term[] {
  const db = getDb();
  const rows = db
    .prepare(
      `SELECT t.id, t.term, t.definition, t.mnemonic, t.source, t.unit_id AS unitId, t.topic_id AS topicId,
              u.name AS unitName, tp.name AS topicName
       FROM quiz_answers qa
       JOIN terms t ON t.id = qa.term_id
       JOIN units u ON u.id = t.unit_id
       JOIN topics tp ON tp.id = t.topic_id
       WHERE qa.attempt_id = ? AND qa.correct = 0
       GROUP BY t.id`
    )
    .all(attemptId) as Array<{
    id: string;
    term: string;
    definition: string;
    mnemonic: string | null;
    source: string | null;
    unitId: number;
    topicId: number;
    unitName: string;
    topicName: string;
  }>;
  return rows.map((r) => ({
    id: r.id,
    topicId: r.topicId,
    unitId: r.unitId,
    unitName: r.unitName,
    topicName: r.topicName,
    term: r.term,
    definition: r.definition,
    mnemonic: r.mnemonic,
    source: r.source ?? '',
  }));
}
