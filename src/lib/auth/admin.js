import 'server-only';
import { NextResponse } from 'next/server';
import { isOwner } from '@/lib/admin/owner-auth';

/**
 * Gate an API route handler so only an authenticated admin can call it.
 *
 * As of 2026-05-15 (Phase 0 URL consolidation) this delegates to
 * `isOwner()`, which accepts BOTH paths:
 *   - Supabase session whose profile.tier === 'admin' (the multi-user
 *     email + password flow)
 *   - Legacy gd_owner shared-secret cookie (kept for break-glass and
 *     the bootstrap flow before the first email/password admin exists)
 *
 * Previously this used a Supabase-only check, which meant legacy-cookie
 * admins got a 401 from money-burning routes (push-overrides, caption
 * generation) even though they could see every UI page. That mismatch
 * is now closed.
 *
 * Used by money-burning routes:
 *   /api/social/generate-caption  (Anthropic credits)
 *   /api/pricing/push-overrides   (PriceLabs writes)
 *   /api/admin/marketing/*        (Phase A-D marketing manager)
 */
export function withAdmin(handler) {
  return async (request, ctx) => {
    const auth = await isOwner();
    if (!auth.authed) {
      // 401 (Unauthorized) signals "you need to authenticate — show the
      // login UI". 403 (Forbidden) would tell clients "your identity is
      // known but you're not allowed", which is misleading when there's
      // no session at all. The DOM/fetch caller can branch on 401 to
      // open /admin/login.
      return NextResponse.json(
        { error: 'authentication required', loginUrl: '/admin/login' },
        { status: 401 },
      );
    }
    return handler(request, ctx, auth);
  };
}
