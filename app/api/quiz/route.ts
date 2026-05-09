import { NextResponse } from 'next/server';
import { generateQuiz } from '@/lib/quiz-gen';
import { recordQuizAttempt } from '@/lib/stats';
import { getMissedTermsFromAttempt } from '@/lib/source';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

interface GenerateBody {
  unitIds?: number[];
  count?: number;
  reviewAttemptId?: number;
}

export async function POST(req: Request) {
  const body = (await req.json()) as GenerateBody;
  const count = Math.max(5, Math.min(75, body.count ?? 10));
  let onlyTermIds: string[] | undefined;
  if (body.reviewAttemptId) {
    const missed = getMissedTermsFromAttempt(body.reviewAttemptId);
    onlyTermIds = missed.map((m) => m.id);
    if (onlyTermIds.length === 0) {
      return NextResponse.json({ error: 'No missed terms to review.' }, { status: 400 });
    }
  }
  const questions = generateQuiz({
    unitIds: body.unitIds,
    count,
    onlyTermIds,
  });
  return NextResponse.json({ questions });
}

interface SubmitBody {
  mode: 'practice' | 'review-misses';
  unitIds: number[];
  durationS: number;
  answers: { termId: string; correct: boolean; confidence: number | null; timeMs: number; questionType: string }[];
}

export async function PUT(req: Request) {
  const body = (await req.json()) as SubmitBody;
  const score = body.answers.filter((a) => a.correct).length;
  const id = recordQuizAttempt({
    mode: body.mode,
    unitIds: body.unitIds,
    score,
    total: body.answers.length,
    durationS: body.durationS,
    answers: body.answers,
  });
  return NextResponse.json({ attemptId: id, score, total: body.answers.length });
}
