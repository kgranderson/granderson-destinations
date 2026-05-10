import 'server-only';
import { createClient } from '@supabase/supabase-js';

/**
 * Admin client — service-role key, bypasses RLS.
 * Isolated into its own file with `import 'server-only'` so the bundler
 * will refuse to include it in any client-component bundle.
 *
 * Use only in: route handlers, server actions, cron jobs, webhooks.
 */
export function getAdminClient() {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return null;
  }
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}
