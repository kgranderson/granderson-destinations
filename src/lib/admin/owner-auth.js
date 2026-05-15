import 'server-only';
import { cookies } from 'next/headers';
import { getServerClient } from '@/lib/supabase/server';
import { getAdminClient } from '@/lib/supabase/admin';

/**
 * Admin-auth gate for /admin and its sub-pages.
 *
 * Two recognized auth paths, in priority order:
 *
 *   1. Supabase Auth session — recommended. Visitor signs in via email +
 *      password at /admin/login. On success their `profiles.tier`
 *      is checked; only tier='admin' gets through.
 *
 *   2. Legacy shared-secret cookie `gd_owner` — bootstrap path for the
 *      original sole-proprietor flow. Owner visits
 *      /api/admin/auth?key=<OWNER_ADMIN_TOKEN> once, the cookie
 *      is set for 30 days, and subsequent visits authenticate via cookie.
 *
 * The legacy path lets the founder bootstrap the multi-user system: visit
 * the legacy URL once, use /admin/users to create real email +
 * password accounts (including one for yourself), then sign in with that.
 *
 * Failure mode: callers should `notFound()` (not 401) so attackers can't
 * probe for the existence of admin endpoints.
 */

const COOKIE = 'gd_owner';
const MAX_AGE_S = 60 * 60 * 24 * 30; // 30 days

function tsEq(a, b) {
  if (!a || !b || a.length !== b.length) return false;
  let mismatch = 0;
  for (let i = 0; i < a.length; i += 1) mismatch |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return mismatch === 0;
}

/**
 * Server-side admin check. Returns:
 *   { authed: true,  via: 'session', user, profile }
 *   { authed: true,  via: 'legacy',  freshKey? }
 *   { authed: false }
 *
 * Path 1 wins when both are present so the richer auth context is preferred.
 *
 * @param {object} [opts]
 * @param {string} [opts.providedKey] — value from ?key= to allow first-time legacy bootstrap.
 */
export async function isOwner({ providedKey } = {}) {
  // ----- Path 1: Supabase Auth session -----
  // We read via a service-role client because anon-key reads against
  // profiles are restricted by RLS to (auth.uid() = id). The service-role
  // bypasses RLS, which is fine here since we already validated the user
  // identity via getServerClient's session cookies.
  try {
    const supabaseSession = getServerClient();
    if (supabaseSession) {
      const { data: { user } } = await supabaseSession.auth.getUser();
      if (user?.id) {
        const adminClient = getAdminClient();
        if (adminClient) {
          const { data: profile } = await adminClient
            .from('profiles')
            .select('id,email,full_name,tier')
            .eq('id', user.id)
            .maybeSingle();
          if (profile?.tier === 'admin') {
            return { authed: true, via: 'session', user, profile };
          }
        }
      }
    }
  } catch (err) {
    // Don't fail the request if the session check itself errors — fall
    // through to the legacy path. Logged so we notice if this gets noisy.
    // eslint-disable-next-line no-console
    console.warn('[owner-auth] session check failed:', err.message || err);
  }

  // ----- Path 2: legacy gd_owner cookie -----
  const expected = process.env.OWNER_ADMIN_TOKEN;
  if (!expected) return { authed: false };
  if (providedKey && tsEq(providedKey, expected)) {
    return { authed: true, via: 'legacy', freshKey: providedKey };
  }
  const c = (await cookies()).get(COOKIE);
  if (c && tsEq(c.value, expected)) return { authed: true, via: 'legacy' };

  return { authed: false };
}

/** Set the legacy gd_owner cookie. Called only from the bootstrap Route Handler. */
export async function setOwnerCookie(value) {
  (await cookies()).set(COOKIE, value, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: MAX_AGE_S,
    path: '/',
  });
}
