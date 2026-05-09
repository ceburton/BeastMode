import { NextResponse } from 'next/server';
import { generateExamMcq } from '@/lib/quiz-gen';
import { pickExamFrqs, frqById } from '@/lib/frq-content';
import { recordExamAttempt } from '@/lib/stats';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  const questions = generateExamMcq(75);
  const { aaq, ebq } = pickExamFrqs();
  return NextResponse.json({ questions, frqs: { aaq, ebq } });
}

interface SubmitExamBody {
  durationS: number;
  frq1: string;
  frq2: string;
  frq1Id: string;
  frq2Id: string;
  answers: { termId: string; correct: boolean; timeMs: number; questionType: string; unitId: number }[];
}

export async function POST(req: Request) {
  const body = (await req.json()) as SubmitExamBody;
  const score = body.answers.filter((a) => a.correct).length;
  const perUnit: Record<number, { correct: number; total: number }> = {};
  for (const a of body.answers) {
    const key = a.unitId;
    perUnit[key] = perUnit[key] ?? { correct: 0, total: 0 };
    perUnit[key].total += 1;
    if (a.correct) perUnit[key].correct += 1;
  }
  const id = recordExamAttempt({
    mcqScore: score,
    mcqTotal: body.answers.length,
    frq1: body.frq1,
    frq2: body.frq2,
    frq1Id: body.frq1Id,
    frq2Id: body.frq2Id,
    perUnit,
    durationS: body.durationS,
    answers: body.answers.map((a) => ({
      termId: a.termId,
      correct: a.correct,
      timeMs: a.timeMs,
      questionType: a.questionType,
    })),
  });
  return NextResponse.json({
    attemptId: id,
    mcqScore: score,
    mcqTotal: body.answers.length,
    perUnit,
    frqs: {
      aaq: frqById(body.frq1Id),
      ebq: frqById(body.frq2Id),
    },
  });
}
