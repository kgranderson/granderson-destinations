import 'server-only';
import { cookies } from 'next/headers';

/**
 * Lightweight owner-auth gate for /maintenance/admin.
 *
 * Mechanism:
 *   1. Owner visits /maintenance/admin?key=<OWNER_ADMIN_TOKEN>
 *   2. We compare to the env var. If equal, set httpOnly cookie 'gd_owner'
 *      with a 30-day expiry containing the same secret.
 *   3. Subsequent visits without ?key= read the cookie and authenticate.
 *
 * This is not a full identity system — it's a single shared secret. Adequate
 * for a sole-proprietor admin page. Upgrade path: swap for Supabase magic-link
 * auth once we wire it into the rest of the app.
 *
 * Security notes:
 *   - The token lives in an env var (OWNER_ADMIN_TOKEN), never the bundle.
 *   - Cookie is httpOnly + secure + sameSite=strict — no XSS exfiltration.
 *   - Constant-time compare to thwart timing attacks (overkill but cheap).
 *   - On invalid token, we 404 rather than 401, so attackers can't probe for
 *     the existence of the admin page.
 */

const COOKIE = 'gd_owner';
const MAX_AGE_S = 60 * 60 * 24 * 30; // 30 days

function tsEq(a, b) {
  if (!a || !b || a.length !== b.length) return false;
  let mismatch = 0;
  for (let i = 0; i < a.length; i += 1) mismatch |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return mismatch === 0;
}

/** Server-side check. Returns true if the visitor is authenticated. */
export async function isOwner({ providedKey } = {}) {
  const expected = process.env.OWNER_ADMIN_TOKEN;
  if (!expected) return false; // unset env var = nobody is owner (fail closed)

  if (providedKey && tsEq(providedKey, expected)) {
    return { authed: true, freshKey: providedKey };
  }
  const c = (await cookies()).get(COOKIE);
  if (c && tsEq(c.value, expected)) return { authed: true };
  return { authed: false };
}

/** Server-action helper — call from a route handler or RSC after isOwner({freshKey}) succeeds. */
export async function setOwnerCookie(value) {
  (await cookies()).set(COOKIE, value, {
    httpOnly: true,
    // Only require HTTPS in production so localhost dev still authenticates.
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: MAX_AGE_S,
    path: '/',
  });
}
