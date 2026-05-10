import 'server-only';
import { NextResponse } from 'next/server';
import { getServerClient } from '@/lib/supabase/server';

/**
 * Gate an API route handler so only an authenticated user whose
 * profile.tier === 'admin' can call it. Returns 401 in stub mode
 * (no Supabase) and 403 when a signed-in non-admin tries to call.
 *
 * Used by money-burning routes:
 *   /api/social/generate-caption  (Anthropic credits)
 *   /api/pricing/push-overrides   (PriceLabs writes)
 */
export function withAdmin(handler) {
  return async (request, ctx) => {
    const supabase = getServerClient();
    if (!supabase) {
      return NextResponse.json(
        { error: 'auth not configured' },
        { status: 401 },
      );
    }
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'not signed in' }, { status: 401 });
    }
    const { data: profile } = await supabase
      .from('profiles')
      .select('tier')
      .eq('id', user.id)
      .maybeSingle();
    if (!profile || profile.tier !== 'admin') {
      return NextResponse.json({ error: 'forbidden' }, { status: 403 });
    }
    return handler(request, ctx);
  };
}
