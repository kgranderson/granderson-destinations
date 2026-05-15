import { NextResponse } from 'next/server';

/**
 * GET /api/admin/auth?key=<OWNER_ADMIN_TOKEN>
 *
 * Owner enters this URL once (with the shared secret in the query string),
 * the route sets an httpOnly cookie scoped to the project, and redirects to
 * the actual admin dashboard. Subsequent visits authenticate via the cookie
 * for 30 days — no key ever needed in the URL again.
 *
 * Why this lives in a Route Handler and not the RSC page itself:
 * Next 14's `cookies()` API is read-only inside Server Components, so
 * `cookies().set(...)` from a page throws at runtime. Cookie mutations are
 * only allowed in Route Handlers, Server Actions, or middleware. This file
 * is the Route Handler that handles the only credential-bearing entry point.
 *
 * Failure mode: any invalid or missing key returns 404 (not 401) so the
 * endpoint doesn't reveal its existence to a probing attacker.
 */

const COOKIE = 'gd_owner';
const MAX_AGE_S = 60 * 60 * 24 * 30; // 30 days

function timingSafeEqual(a, b) {
  if (!a || !b || a.length !== b.length) return false;
  let mismatch = 0;
  for (let i = 0; i < a.length; i += 1) mismatch |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return mismatch === 0;
}

export async function GET(request) {
  const expected = process.env.OWNER_ADMIN_TOKEN;
  if (!expected) {
    // Env var unset = nobody is owner. Fail closed with a 404.
    return new NextResponse('Not found', { status: 404 });
  }

  const url = new URL(request.url);
  const provided = url.searchParams.get('key');
  if (!provided || !timingSafeEqual(provided, expected)) {
    return new NextResponse('Not found', { status: 404 });
  }

  // Valid token — set the cookie and redirect to the clean admin URL.
  const redirectUrl = new URL('/admin', url.origin);
  const response = NextResponse.redirect(redirectUrl, { status: 303 });
  response.cookies.set(COOKIE, provided, {
    httpOnly: true,
    // Only require HTTPS in production so localhost dev still authenticates.
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: MAX_AGE_S,
    path: '/',
  });
  return response;
}
