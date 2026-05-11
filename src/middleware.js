import { NextResponse } from 'next/server';
import { updateSession } from '@/lib/supabase/middleware';

// /intel is public marketing — must not be gated.
// /economics, /social, /pricing-engine are admin dashboards but currently
// render synthetic/stub data; once M7 ships the real auth UI + magic-link
// flow, they re-enter PROTECTED_PREFIXES alongside a tier === 'admin' check.
// /api/social/generate-caption and /api/pricing/push-overrides retain their
// own admin-tier gates at the route handler level so the public can't burn
// our Anthropic/PriceLabs credits even while these pages are open.
// /admin/* requires an authenticated session AND admin tier — the
// tier check happens at the page level (see app/admin/import/page.jsx).
const PROTECTED_PREFIXES = ['/dashboard', '/account', '/trips', '/admin'];

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

  // Auth pages — if already signed in, bounce to /economics (admins) or home.
  // Exclude /auth/callback so the OAuth code exchange completes.
  if (pathname.startsWith('/auth/') && !pathname.startsWith('/auth/callback') && session) {
    const url = request.nextUrl.clone();
    url.pathname = '/economics';
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
