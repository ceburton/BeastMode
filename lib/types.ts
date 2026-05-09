export interface Unit {
  id: number;
  name: string;
  slug: string;
}

export interface Topic {
  id: number;
  unitId: number;
  name: string;
  position: number;
}

export interface Term {
  id: string;
  topicId: number;
  unitId: number;
  unitName: string;
  topicName: string;
  term: string;
  definition: string;
  mnemonic?: string | null;
  examples?: string[];
  source?: string;
}

export interface CardProgress {
  termId: string;
  intervalDays: number;
  ease: number;
  reviews: number;
  lapses: number;
  dueDate: string;
  lastReview: string | null;
}

export type Grade = 'again' | 'hard' | 'good' | 'easy';

export interface QuizQuestion {
  id: string;
  termId: string;
  unitId: number;
  topicId: number;
  topicName: string;
  unitName: string;
  type: 'term-to-def' | 'def-to-term' | 'scenario';
  stem: string;
  choices: string[];
  correctIndex: number;
  explanation: string;
}

export interface QuizAttempt {
  id?: number;
  mode: 'practice' | 'exam-mcq' | 'review-misses';
  unitIds: number[];
  score: number;
  total: number;
  durationS: number;
  takenAt: string;
}

export interface QuizAnswerRow {
  attemptId: number;
  termId: string;
  correct: number;
  confidence: number | null;
  timeMs: number;
  questionType: string;
}

export interface ExamAttempt {
  id?: number;
  mcqScore: number;
  mcqTotal: number;
  frq1: string;
  frq2: string;
  frq1Id: string;
  frq2Id: string;
  takenAt: string;
  perUnit: Record<string, { correct: number; total: number }>;
  durationS: number;
}

export interface FrqPrompt {
  id: string;
  kind: 'AAQ' | 'EBQ';
  title: string;
  scenario: string;
  questions: { label: string; prompt: string }[];
  rubric: { points: number; criteria: string }[];
  modelKeyConcepts: string[];
  unitIds: number[];
}
