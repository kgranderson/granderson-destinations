/**
 * @deprecated 2026-05-15. Use `isOwner()` from `@/lib/admin/owner-auth` instead.
 *
 * The Supabase-only `assertAdmin()` gate has been retired in favor of the
 * dual-path `isOwner()` helper, which accepts both Supabase sessions (the
 * email + password flow shipped in the multi-user auth build) and the legacy
 * `gd_owner` cookie. This file is kept as a stub so older imports don't blow
 * up if any reappear during refactor; everything that referenced it has been
 * migrated. Safe to delete in a follow-up cleanup commit.
 */

export async function assertAdmin() {
  throw new Error(
    "assertAdmin() is removed. Use `isOwner()` from '@/lib/admin/owner-auth' instead.",
  );
}
