import { NextResponse } from 'next/server';
import { getServerClient } from '@/lib/supabase/server';

/**
 * OAuth callback handler. Exchanges the auth code for a session,
 * then bounces to /dashboard (or ?redirect=).
 *
 * In stub mode (no Supabase envs) it just redirects home.
 */
export async function GET(request) {
  const url = new URL(request.url);
  const code = url.searchParams.get('code');
  // /dashboard isn't built yet; admins generally want /economics.
  // The login page passes ?redirect= when it wants somewhere specific.
  const next = url.searchParams.get('redirect') || '/economics';

  const supabase = getServerClient();
  if (!supabase || !code) {
    return NextResponse.redirect(new URL('/', request.url));
  }

  const { error } = await supabase.auth.exchangeCodeForSession(code);
  if (error) {
    return NextResponse.redirect(new URL(`/auth/login?error=${encodeURIComponent(error.message)}`, request.url));
  }
  return NextResponse.redirect(new URL(next, request.url));
}
