import { NextResponse } from 'next/server';
import { secretEqual } from '@/lib/reliability/core.mjs';
import { latestRuns } from '@/lib/reliability/service';
export const dynamic = 'force-dynamic';
export async function GET(request) {
  const headers = { 'Cache-Control': 'no-store', 'X-Robots-Tag': 'noindex' };
  if (!secretEqual(request.headers.get('authorization'), `Bearer ${process.env.KEY_CHECK_READ_TOKEN || ''}`) || !process.env.KEY_CHECK_READ_TOKEN) return NextResponse.json({ code: 'unauthorized' }, { status: 401, headers });
  const { runs, code } = await latestRuns();
  if (code) return NextResponse.json({ code }, { status: 503, headers });
  if (!runs.length) return NextResponse.json({ code: 'no_runs' }, { status: 404, headers });
  return NextResponse.json({ app: 'granderson_destinations', schema: 1, run: runs[0] }, { headers });
}
