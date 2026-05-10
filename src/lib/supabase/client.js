import { createBrowserClient } from '@supabase/ssr';

let client = null;

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
 * Singleton browser client. Returns null in stub mode OR when
 * NEXT_PUBLIC_SUPABASE_URL is malformed.
 */
export function getBrowserClient() {
  const url = validSupabaseUrl(process.env.NEXT_PUBLIC_SUPABASE_URL);
  if (!url || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    return null;
  }
  if (!client) {
    client = createBrowserClient(url, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
  }
  return client;
}
