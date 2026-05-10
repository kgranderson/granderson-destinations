import 'server-only';
import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';
import { createClient } from '@supabase/supabase-js';

/**
 * Per-request server client (cookie-bound for auth).
 * NOTE: cookies() opts the calling route into dynamic rendering.
 * For public reads from cacheable pages, use getPublicReadClient().
 * Returns null in stub mode.
 */
export function getServerClient() {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    return null;
  }
  const cookieStore = cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options));
          } catch {
            /* In a Server Component context, set may throw — middleware refreshes. */
          }
        },
      },
    },
  );
}

/**
 * Public read client — anon key, no cookies. Safe for cacheable
 * Server Components doing read-only queries on RLS-public tables
 * (properties, hotspots, anchor_events, intel_items).
 */
export function getPublicReadClient() {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    return null;
  }
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

// Re-export from admin.js for backwards-compat. Prefer importing from '@/lib/supabase/admin' directly.
export { getAdminClient } from './admin';
