import { NextResponse } from 'next/server';
import { updateSession } from '@/lib/supabase/middleware';

const PROTECTED_PREFIXES = ['/dashboard', '/account', '/trips', '/admin', '/economics', '/social', '/pricing-engine', '/intel'];

export async function middleware(request) {
  // Refresh Supabase session if configured; otherwise pass through unchanged.
  let response = NextResponse.next({ request });
  const supabaseConfigured =
    !!process.env.NEXT_PUBLIC_SUPABASE_URL && !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  let session = null;
  if (supabaseConfigured) {
    const result = await updateSession(request);
    response = result.response;
    session = result.session;
  }

  const { pathname } = request.nextUrl;
  const isProtected = PROTECTED_PREFIXES.some((p) => pathname.startsWith(p));

  // If Supabase isn't configured (stub mode), let everything through so the
  // marketing site remains usable while keys are being provisioned.
  if (isProtected && supabaseConfigured && !session) {
    const url = request.nextUrl.clone();
    url.pathname = '/auth/login';
    url.searchParams.set('redirect', pathname);
    return NextResponse.redirect(url);
  }

  // Auth pages — if already signed in, bounce to dashboard.
  if (pathname.startsWith('/auth/') && session) {
    const url = request.nextUrl.clone();
    url.pathname = '/dashboard';
    return NextResponse.redirect(url);
  }

  return response;
}

export const config = {
  matcher: [
    /*
     * Skip Next.js internals + static asset extensions.
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|avif|ico)$).*)',
  ],
};
