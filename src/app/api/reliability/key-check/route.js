import { NextResponse } from 'next/server';
import { withCronAuth } from '@/lib/auth/cron';
import { runKeyCheck } from '@/lib/reliability/service';
export const dynamic = 'force-dynamic';
export const maxDuration = 120;
export const GET = withCronAuth(async () => {
  try { const r = await runKeyCheck(); return NextResponse.json(r, { status: r.status, headers: { 'Cache-Control': 'no-store' } }); }
  catch { return NextResponse.json({ code: 'key_check_failed' }, { status: 503 }); }
});
