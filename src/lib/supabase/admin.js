import 'server-only';
import { createClient } from '@supabase/supabase-js';

function validSupabaseUrl(u) {
  if (!u || typeof u !== 'string') return null;
  const trimmed = u.trim();
  try {
    const parsed = new URL(trimmed);
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') return null;
    return trimmed;
  } catch {
    return null;
  }
}

/**
 * Admin client — service-role key, bypasses RLS.
 * Isolated into its own file with `import 'server-only'` so the bundler
 * will refuse to include it in any client-component bundle.
 *
 * Returns null in stub mode OR when SUPABASE_URL is malformed.
 * Use only in: route handlers, server actions, cron jobs, webhooks.
 */
export function getAdminClient() {
  const url = validSupabaseUrl(process.env.NEXT_PUBLIC_SUPABASE_URL);
  if (!url || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return null;
  }
  return createClient(url, process.env.SUPABASE_SERVICE_ROLE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}
