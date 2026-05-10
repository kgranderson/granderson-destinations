import { NextResponse } from 'next/server';
import { withCronAuth } from '@/lib/auth/cron';

/**
 * Generic cron endpoint. Vercel cron config (vercel.json) calls this
 * with ?job=<name>. Concrete jobs ship in M3–M5:
 *   - intel-refresh (Perplexity)
 *   - pricing-sync (PriceLabs)
 *   - ig-publish-due (Instagram)
 */
export const POST = withCronAuth(async (request) => {
  const url = new URL(request.url);
  const job = url.searchParams.get('job');
  return NextResponse.json({ ok: true, job: job ?? null, stub: true, at: new Date().toISOString() });
});

export const GET = POST;
