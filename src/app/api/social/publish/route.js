import { NextResponse } from 'next/server';
import { withCronAuth } from '@/lib/auth/cron';

/**
 * Publishes scheduled IG posts whose scheduled_at <= now.
 * Full implementation in M5. Stub returns no-op.
 */
export const POST = withCronAuth(async () => {
  return NextResponse.json({ ok: true, published: 0, stub: true });
});

export const GET = POST;
