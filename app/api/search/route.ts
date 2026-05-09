import { NextResponse } from 'next/server';
import { getAllTermsFlat } from '@/lib/source';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  const terms = getAllTermsFlat();
  return NextResponse.json({ terms });
}
