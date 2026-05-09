import 'server-only';
import { getDb } from './db';
import { pickN, shuffle } from './utils';
import { SCENARIO_TEMPLATES } from './scenario-templates';
import type { QuizQuestion, Term } from './types';

interface DbTerm {
  id: string;
  term: string;
  definition: string;
  mnemonic: string | null;
  unit_id: number;
  topic_id: number;
  unit_name: string;
  topic_name: string;
}

function loadTerms(unitIds?: number[]): DbTerm[] {
  const db = getDb();
  const params: number[] = [];
  let sql = `
    SELECT t.id, t.term, t.definition, t.mnemonic, t.unit_id, t.topic_id,
           u.name AS unit_name, tp.name AS topic_name
    FROM terms t
    JOIN units u ON u.id = t.unit_id
    JOIN topics tp ON tp.id = t.topic_id
  `;
  if (unitIds && unitIds.length) {
    sql += ` WHERE t.unit_id IN (${unitIds.map(() => '?').join(',')})`;
    params.push(...unitIds);
  }
  return db.prepare(sql).all(...params) as DbTerm[];
}

function chooseDistractors(target: DbTerm, pool: DbTerm[], n = 3): string[] {
  const sameTopic = pool.filter((t) => t.topic_id === target.topic_id && t.id !== target.id);
  const sameUnit = pool.filter(
    (t) => t.unit_id === target.unit_id && t.topic_id !== target.topic_id && t.id !== target.id
  );
  const others = pool.filter((t) => t.unit_id !== target.unit_id);
  const ordered = [...shuffle(sameTopic), ...shuffle(sameUnit), ...shuffle(others)];
  const seen = new Set<string>([target.term.toLowerCase()]);
  const out: string[] = [];
  for (const c of ordered) {
    const key = c.term.toLowerCase();
    if (seen.has(key)) continue;
    out.push(c.term);
    seen.add(key);
    if (out.length >= n) break;
  }
  while (out.length < n) out.push('None of the above');
  return out;
}

function chooseDefDistractors(target: DbTerm, pool: DbTerm[], n = 3): string[] {
  const sameTopic = pool.filter((t) => t.topic_id === target.topic_id && t.id !== target.id);
  const sameUnit = pool.filter(
    (t) => t.unit_id === target.unit_id && t.topic_id !== target.topic_id && t.id !== target.id
  );
  const ordered = [...shuffle(sameTopic), ...shuffle(sameUnit)];
  const out: string[] = [];
  const seen = new Set<string>([target.definition]);
  for (const c of ordered) {
    if (seen.has(c.definition)) continue;
    out.push(truncate(c.definition, 140));
    seen.add(c.definition);
    if (out.length >= n) break;
  }
  while (out.length < n) out.push('None of the above');
  return out;
}

function truncate(s: string, max: number): string {
  if (s.length <= max) return s;
  return s.slice(0, max - 1).trimEnd() + '…';
}

function makeTermToDef(target: DbTerm, pool: DbTerm[]): QuizQuestion {
  const correct = truncate(target.definition, 140);
  const distractors = chooseDefDistractors(target, pool, 3);
  const choices = shuffle([correct, ...distractors]);
  const correctIndex = choices.indexOf(correct);
  return {
    id: `tdf-${target.id}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    termId: target.id,
    unitId: target.unit_id,
    topicId: target.topic_id,
    topicName: target.topic_name,
    unitName: target.unit_name,
    type: 'term-to-def',
    stem: `Which of the following best describes "${target.term}"?`,
    choices,
    correctIndex,
    explanation:
      target.mnemonic
        ? `${target.term}: ${target.definition}\n\nMnemonic: ${target.mnemonic}`
        : `${target.term}: ${target.definition}`,
  };
}

function makeDefToTerm(target: DbTerm, pool: DbTerm[]): QuizQuestion {
  const distractors = chooseDistractors(target, pool, 3);
  const choices = shuffle([target.term, ...distractors]);
  const correctIndex = choices.indexOf(target.term);
  return {
    id: `dtt-${target.id}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    termId: target.id,
    unitId: target.unit_id,
    topicId: target.topic_id,
    topicName: target.topic_name,
    unitName: target.unit_name,
    type: 'def-to-term',
    stem: `${target.definition}\n\nWhich term best fits this description?`,
    choices,
    correctIndex,
    explanation:
      target.mnemonic
        ? `${target.term}: ${target.definition}\n\nMnemonic: ${target.mnemonic}`
        : `${target.term}: ${target.definition}`,
  };
}

function makeScenario(
  template: (typeof SCENARIO_TEMPLATES)[number],
  pool: DbTerm[]
): QuizQuestion | null {
  const target = pool.find((t) => t.term.toLowerCase() === template.targetTermLowercase);
  if (!target) return null;
  const answer = template.answerOverride ?? target.term;
  const distractors = chooseDistractors(target, pool, 3);
  const choices = shuffle([answer, ...distractors]);
  const correctIndex = choices.indexOf(answer);
  return {
    id: `scn-${template.id}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    termId: target.id,
    unitId: target.unit_id,
    topicId: target.topic_id,
    topicName: target.topic_name,
    unitName: target.unit_name,
    type: 'scenario',
    stem: template.stem,
    choices,
    correctIndex,
    explanation: `${target.term}: ${target.definition}`,
  };
}

export interface GenerateQuizOptions {
  unitIds?: number[];
  count: number;
  /** restrict to specific term IDs (used for "review missed" mode) */
  onlyTermIds?: string[];
  /** force a single question type — defaults to 40/30/30 mix */
  forceType?: 'term-to-def' | 'def-to-term' | 'scenario';
}

export function generateQuiz(opts: GenerateQuizOptions): QuizQuestion[] {
  const allPool = loadTerms();
  const pool = opts.unitIds && opts.unitIds.length ? allPool.filter((t) => opts.unitIds!.includes(t.unit_id)) : allPool;
  if (pool.length < 4) return [];

  const targetPool = opts.onlyTermIds
    ? pool.filter((t) => opts.onlyTermIds!.includes(t.id))
    : pool;
  if (targetPool.length === 0) return [];

  const questions: QuizQuestion[] = [];
  const usedTerms = new Set<string>();

  // 40% scenarios first (only those whose target exists in the pool)
  const scenariosWanted = opts.forceType === 'scenario' ? opts.count : Math.round(opts.count * 0.4);
  const eligibleTemplates = SCENARIO_TEMPLATES.filter((tpl) => {
    if (opts.unitIds && opts.unitIds.length && !opts.unitIds.includes(tpl.unitId)) return false;
    return targetPool.some((t) => t.term.toLowerCase() === tpl.targetTermLowercase);
  });
  const pickedScenarios = pickN(eligibleTemplates, scenariosWanted);
  for (const tpl of pickedScenarios) {
    const q = makeScenario(tpl, allPool); // distractors from full pool of selected units
    if (q && !usedTerms.has(q.termId)) {
      questions.push(q);
      usedTerms.add(q.termId);
    }
  }

  // Now fill remaining with 30/30 split term->def / def->term (or whatever was forced)
  const remaining = opts.count - questions.length;
  if (remaining > 0) {
    const candidates = shuffle(targetPool.filter((t) => !usedTerms.has(t.id)));
    let i = 0;
    while (questions.length < opts.count && i < candidates.length) {
      const target = candidates[i++];
      // Skip if target def is too short to make a useful question
      if (target.definition.length < 5) continue;

      let type = opts.forceType;
      if (!type) {
        const remainingScenarios = scenariosWanted - questions.filter((q) => q.type === 'scenario').length;
        // 30/30 between term-to-def and def-to-term, biased to keep variety
        const hasMoreOfTtd =
          questions.filter((q) => q.type === 'term-to-def').length >
          questions.filter((q) => q.type === 'def-to-term').length;
        type = hasMoreOfTtd ? 'def-to-term' : 'term-to-def';
        // But occasionally do a scenario if we still need more
        if (remainingScenarios > 0 && Math.random() < 0.2) {
          // try one more scenario template
          const tpl = eligibleTemplates.find((tpl) => !pickedScenarios.includes(tpl) &&
            !usedTerms.has(targetPool.find((p) => p.term.toLowerCase() === tpl.targetTermLowercase)?.id ?? ''));
          if (tpl) {
            const q = makeScenario(tpl, allPool);
            if (q) {
              questions.push(q);
              usedTerms.add(q.termId);
              continue;
            }
          }
        }
      }

      let q: QuizQuestion | null = null;
      if (type === 'term-to-def') q = makeTermToDef(target, allPool);
      else if (type === 'def-to-term') q = makeDefToTerm(target, allPool);
      else if (type === 'scenario') {
        // scenario forced but no template — fall back to term-to-def
        q = makeTermToDef(target, allPool);
      }
      if (q) {
        questions.push(q);
        usedTerms.add(q.termId);
      }
    }
  }

  return shuffle(questions).slice(0, opts.count);
}

/**
 * Generate exam-style 75 MCQ split proportionally across all 12 units.
 * Each unit contributes a share roughly proportional to its term count, with
 * a floor of 3 questions per unit so even small units are represented.
 */
export function generateExamMcq(count: number = 75): QuizQuestion[] {
  const db = getDb();
  const counts = db.prepare('SELECT unit_id AS uid, COUNT(*) AS n FROM terms GROUP BY unit_id').all() as {
    uid: number;
    n: number;
  }[];
  const total = counts.reduce((a, b) => a + b.n, 0);
  const minPerUnit = 3;

  const allocations: { unitId: number; want: number }[] = counts.map((c) => ({
    unitId: c.uid,
    want: Math.max(minPerUnit, Math.round((c.n / total) * count)),
  }));
  // Adjust until total === count
  let allocated = allocations.reduce((a, b) => a + b.want, 0);
  while (allocated > count) {
    // shave from largest
    allocations.sort((a, b) => b.want - a.want);
    allocations[0].want -= 1;
    allocated -= 1;
  }
  while (allocated < count) {
    allocations.sort((a, b) => a.want - b.want);
    allocations[allocations.length - 1].want += 1;
    allocated += 1;
  }

  const questions: QuizQuestion[] = [];
  for (const { unitId, want } of allocations) {
    questions.push(...generateQuiz({ unitIds: [unitId], count: want }));
  }
  return shuffle(questions);
}
