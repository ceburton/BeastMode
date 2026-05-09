import { NextResponse } from 'next/server';
import { logStudySession } from '@/lib/stats';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

interface MatchBody {
  unitIds: number[];
  durationS: number;
  pairs: number;
}

export async function POST(req: Request) {
  const body = (await req.json()) as MatchBody;
  logStudySession('match', body.durationS);
  return NextResponse.json({ ok: true });
}
