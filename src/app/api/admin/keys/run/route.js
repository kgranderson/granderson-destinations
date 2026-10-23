import { NextResponse } from 'next/server';
import { withAdmin } from '@/lib/auth/admin';
import { runKeyCheck } from '@/lib/reliability/service';
export const maxDuration = 120;
export const POST = withAdmin(async (_request, _ctx, auth) => {
  try { const result = await runKeyCheck(auth); return NextResponse.json(result, { status: result.status, headers: { 'Cache-Control': 'no-store' } }); }
  catch { return NextResponse.json({ code: 'key_check_failed' }, { status: 503 }); }
});
