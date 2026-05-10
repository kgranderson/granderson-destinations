import 'server-only';
import { NextResponse } from 'next/server';

/**
 * Wraps a cron-triggered route handler with shared-secret auth.
 * Vercel Cron and external schedulers must send:
 *   Authorization: Bearer <CRON_SECRET>
 */
export function withCronAuth(handler) {
  return async (request, ctx) => {
    const auth = request.headers.get('authorization') || '';
    const provided = auth.replace(/^Bearer\s+/i, '').trim();
    const expected = process.env.CRON_SECRET;
    if (!expected || provided !== expected) {
      return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
    }
    return handler(request, ctx);
  };
}
