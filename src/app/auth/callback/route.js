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
  const requested = url.searchParams.get('redirect') || '/admin';
  const next = requested.startsWith('/') && !requested.startsWith('//') && !requested.includes('\\') ? requested : '/admin';

  const supabase = await getServerClient();
  if (!supabase || !code) {
    return NextResponse.redirect(new URL('/', request.url));
  }

  const { error } = await supabase.auth.exchangeCodeForSession(code);
  if (error) {
    return NextResponse.redirect(new URL(`/auth/login?error=${'sign_in_failed'}`, request.url));
  }
  return NextResponse.redirect(new URL(next, request.url));
}

