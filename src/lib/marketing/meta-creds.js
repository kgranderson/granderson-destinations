import 'server-only';
/**
 * Per-property Meta (Instagram Graph) credentials.
 *
 * The legacy social engine read a single global META_LONG_LIVED_TOKEN
 * + META_INSTAGRAM_BUSINESS_ID from env. Phase C moves to per-property
 * creds stored on public.properties so each property posts as its own
 * IG Business account.
 *
 * Tokens are stored in plaintext in the database — the service-role
 * key is the only credential that can read them, and Supabase RLS
 * is enabled on the table. A follow-up will wrap them with pgsodium
 * for at-rest encryption, but the priority for v1 is the operator
 * workflow (create + view + push). The settings UI masks tokens to
 * last 4 chars after the first save.
 */
import { getAdminClient } from '@/lib/supabase/admin';

/**
 * Load Meta credentials for a property. Returns null if none saved,
 * else the full record. Reads via service-role (bypasses RLS).
 */
export async function loadMetaCreds(propertySlug) {
  const supabase = getAdminClient();
  if (!supabase) return null;

  const { data, error } = await supabase
    .from('properties')
    .select(
      'id, slug, ig_business_id, ig_access_token, ig_token_expires_at, fb_page_id, meta_ad_account_id',
    )
    .eq('slug', propertySlug)
    .maybeSingle();

  if (error || !data) return null;
  return data;
}

/**
 * Mask sensitive fields for client-facing return. Shows last 4 chars
 * of the access token so the operator can confirm what's saved
 * without exposing the full credential to logs / browser memory.
 */
export function maskMetaCreds(creds) {
  if (!creds) return null;
  const token = creds.ig_access_token;
  const masked = token ? `••••${token.slice(-4)}` : null;
  return {
    ...creds,
    ig_access_token: undefined,        // never echo the real value back
    ig_access_token_preview: masked,   // what the UI displays
    has_token: !!token,
    token_expires_at: creds.ig_token_expires_at,
    // Surface days-to-expiry so the UI can show a warning banner
    token_expires_in_days: creds.ig_token_expires_at
      ? Math.floor(
          (new Date(creds.ig_token_expires_at).getTime() - Date.now()) / 86_400_000,
        )
      : null,
  };
}

/**
 * Save / update Meta credentials. Fields are optional — pass only
 * what's changing. Empty strings clear the field (e.g. an operator
 * deleting the token to disconnect the account). Returns the masked
 * shape (suitable for echoing back to the client).
 */
export async function saveMetaCreds(propertySlug, partial) {
  const supabase = getAdminClient();
  if (!supabase) {
    throw new Error('storage not configured');
  }

  const update = {};
  if (typeof partial.ig_business_id === 'string') {
    update.ig_business_id = partial.ig_business_id.trim() || null;
  }
  if (typeof partial.fb_page_id === 'string') {
    update.fb_page_id = partial.fb_page_id.trim() || null;
  }
  if (typeof partial.meta_ad_account_id === 'string') {
    update.meta_ad_account_id = partial.meta_ad_account_id.trim() || null;
  }
  if (typeof partial.ig_access_token === 'string') {
    const raw = partial.ig_access_token.trim();
    // Reject anything that looks too short to be a real long-lived
    // token — Meta tokens are ~200 chars. Operators occasionally paste
    // a short-lived "user access token" that expires in 1hr; catch
    // that early rather than at publish time.
    if (raw && raw.length < 50) {
      throw new Error('Token looks too short — paste the full long-lived token from Meta');
    }
    update.ig_access_token = raw || null;
  }
  if (partial.ig_token_expires_at !== undefined) {
    update.ig_token_expires_at = partial.ig_token_expires_at || null;
  }

  if (Object.keys(update).length === 0) {
    return maskMetaCreds(await loadMetaCreds(propertySlug));
  }

  const { data, error } = await supabase
    .from('properties')
    .update(update)
    .eq('slug', propertySlug)
    .select(
      'id, slug, ig_business_id, ig_access_token, ig_token_expires_at, fb_page_id, meta_ad_account_id',
    )
    .single();

  if (error) throw new Error(error.message || 'failed to save credentials');
  return maskMetaCreds(data);
}

/**
 * Returns true if the property has at minimum an IG Business ID +
 * an access token saved. Used by publishImage to decide whether to
 * use per-property creds vs. fall back to env.
 */
export function hasPropertyCreds(creds) {
  return !!(creds?.ig_business_id && creds?.ig_access_token);
}
