import { createBrowserClient } from '@supabase/ssr';

let client = null;

/**
 * Singleton browser client. Returns null in stub mode (no envs) so
 * components can fall back to mock data without throwing.
 */
export function getBrowserClient() {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    return null;
  }
  if (!client) {
    client = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    );
  }
  return client;
}
