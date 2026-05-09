import { NextResponse } from 'next/server';
import { getDeck, gradeCard } from '@/lib/srs';
import { logStudySession } from '@/lib/stats';
import type { Grade } from '@/lib/types';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const scope = (searchParams.get('scope') as 'due' | 'all' | 'new' | 'lapsed') ?? 'due';
  const unitsRaw = searchParams.get('units');
  const limitRaw = searchParams.get('limit');
  const unitIds = unitsRaw ? unitsRaw.split(',').map((s) => Number(s)).filter(Boolean) : undefined;
  const limit = limitRaw ? Number(limitRaw) : 200;
  const deck = getDeck({ scope, unitIds, limit });
  return NextResponse.json({ deck });
}

export async function POST(req: Request) {
  const body = (await req.json()) as { termId: string; grade: Grade; sessionSeconds?: number };
  if (!body.termId || !body.grade) {
    return NextResponse.json({ error: 'Missing termId or grade' }, { status: 400 });
  }
  gradeCard(body.termId, body.grade);
  if (body.sessionSeconds && body.sessionSeconds > 0) {
    logStudySession('flashcards', body.sessionSeconds);
  }
  return NextResponse.json({ ok: true });
}
