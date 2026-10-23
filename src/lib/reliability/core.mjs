import { createHmac, timingSafeEqual, createHash } from 'node:crypto';
import { boundedJson } from '../http.mjs';

export const OUTCOMES = ['pass', 'degraded', 'invalid_auth', 'permission_or_resource', 'quota_rate', 'provider_unavailable', 'configured', 'missing', 'skipped'];
const BAD = new Set(['invalid_auth', 'permission_or_resource', 'quota_rate', 'provider_unavailable', 'missing']);
export function secretEqual(a, b) {
  if (typeof a !== 'string' || typeof b !== 'string' || !a || !b) return false;
  return timingSafeEqual(createHash('sha256').update(a).digest(), createHash('sha256').update(b).digest());
}
export function versionTag(value, salt) {
  return value && salt ? createHmac('sha256', salt).update(value).digest('base64url').slice(0, 8) : null;
}
export function byStatus(status) {
  if (status >= 200 && status < 300) return { outcome: 'pass', detail: 'accepted' };
  if (status === 401) return { outcome: 'invalid_auth', detail: 'unauthorized' };
  if (status === 403) return { outcome: 'permission_or_resource', detail: 'forbidden' };
  if (status === 404) return { outcome: 'permission_or_resource', detail: 'not_found' };
  if (status === 429) return { outcome: 'quota_rate', detail: 'rate_limited' };
  if (status >= 500) return { outcome: 'provider_unavailable', detail: 'upstream_error' };
  return { outcome: 'permission_or_resource', detail: 'rejected' };
}
export function summarize(results) {
  const counts = Object.fromEntries(OUTCOMES.map(o => [o, results.filter(r => r.outcome === o).length]));
  return { healthy: !results.some(r => BAD.has(r.outcome)), counts };
}
export function productionEnabled(env) {
  return env.KEY_CHECK_ENABLED === 'true' && env.VERCEL_ENV === 'production' &&
    env.NEXT_PUBLIC_SUPABASE_URL?.replace(/\/$/, '') === 'https://yyhfdqunyufjoyztvcti.supabase.co';
}

// Only fixed, reviewed endpoints may receive credentials. No endpoint is supplied by the browser.
export const CHECKS = [
  ['supabase_anon', 'Supabase public key', 'NEXT_PUBLIC_SUPABASE_ANON_KEY', 'supabase_anon', true],
  ['supabase_service_role', 'Supabase server key', 'SUPABASE_SERVICE_ROLE_KEY', 'supabase_service', true],
  ['anthropic_key', 'Claude', 'ANTHROPIC_API_KEY', 'anthropic', true],
  ['clickup', 'ClickUp', 'CLICKUP_API_TOKEN', 'clickup', false],
  ['twilio', 'Twilio', 'TWILIO_AUTH_TOKEN', 'twilio', false],
  ['gmail', 'Gmail SMTP', 'GMAIL_APP_PASSWORD', 'presence', false],
  ['perplexity', 'Perplexity', 'PERPLEXITY_API_KEY', 'paid', false],
  ['google_places', 'Google Places', 'GOOGLE_PLACES_API_KEY', 'paid', false],
  ['google_maps', 'Google Maps browser key', 'NEXT_PUBLIC_GOOGLE_MAPS_API_KEY', 'paid', false],
  ['airdna', 'AirDNA', 'AIRDNA_API_KEY', 'paid', false],
  ['pricelabs', 'PriceLabs', 'PRICELABS_API_KEY', 'paid', false],
  ['hospitable', 'Hospitable', 'HOSPITABLE_API_KEY', 'presence', false],
  ['stripe_secret', 'Stripe', 'STRIPE_SECRET_KEY', 'stripe', false],
  ['stripe_publishable', 'Stripe browser key', 'NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY', 'presence', false],
  ['stripe_webhook', 'Stripe webhook', 'STRIPE_WEBHOOK_SECRET', 'webhook', false],
  ['meta_token', 'Meta global token', 'META_LONG_LIVED_TOKEN', 'presence', false],
  ['meta_app_secret', 'Meta app secret', 'META_APP_SECRET', 'presence', false],
  ['owner_admin_token', 'Legacy owner login', 'OWNER_ADMIN_TOKEN', 'presence', false],
  ['cron_secret', 'Scheduled checks', 'CRON_SECRET', 'presence', true],
  ['key_check_read_token', 'Registry read token', 'KEY_CHECK_READ_TOKEN', 'presence', true],
  ['key_check_version_salt', 'Key version salt', 'KEY_CHECK_VERSION_SALT', 'presence', true],
  ['resend', 'Key-check email delivery', 'RESEND_API_KEY', 'resend', false],
].map(([id, label, variable, kind, required]) => ({ id, label, variable, kind, required }));

export async function checkKeys(env, { fetcher = fetch, now = Date.now } = {}) {
  const deadline = now() + 50_000;
  let requests = 0;
  const request = async (url, headers) => {
    if (++requests > 14 || now() >= deadline) throw new Error('budget');
    const res = await fetcher(url, { headers, redirect: 'error', cache: 'no-store', signal: AbortSignal.timeout(Math.max(1, Math.min(10_000, deadline - now()))) });
    // Inspect only explicitly needed fields. Never return provider bodies or exception text.
    const body = await boundedJson(res, 250000).catch(() => ({}));
    return { status: res.status, body, ...byStatus(res.status) };
  };
  async function run(c) {
    const value = env[c.variable];
    const result = { id: c.id, label: c.label, variable: c.variable, version_tag: versionTag(value, env.KEY_CHECK_VERSION_SALT) };
    const done = (outcome, detail, http_status = null) => ({ ...result, outcome, detail, http_status });
    if (!value) return done(c.required ? 'missing' : 'skipped', c.required ? 'env_missing' : 'not_configured');
    if (c.kind === 'paid') return done('skipped', 'no_free_probe');
    if (c.kind === 'presence') return done('configured', 'presence_only');
    if (c.kind === 'webhook') return done('degraded', 'webhook_not_implemented');
    try {
      let r;
      if (c.kind.startsWith('supabase')) {
        if (env.NEXT_PUBLIC_SUPABASE_URL?.replace(/\/$/, '') !== 'https://yyhfdqunyufjoyztvcti.supabase.co') return done('permission_or_resource', 'project_mismatch');
        if (c.kind === 'supabase_anon') {
          let role;
          try { role = JSON.parse(Buffer.from(value.split('.')[1], 'base64url')).role; } catch { /* publishable key */ }
          if (value.startsWith('sb_secret_') || role === 'service_role') return done('invalid_auth', 'secret_in_public_var');
          r = await request('https://yyhfdqunyufjoyztvcti.supabase.co/auth/v1/settings', { apikey: value });
        } else {
          let role;
          try { role = JSON.parse(Buffer.from(value.split('.')[1], 'base64url')).role; } catch { /* secret key */ }
          if (!value.startsWith('sb_secret_') && role !== 'service_role') return done('invalid_auth', 'wrong_role');
          r = await request('https://yyhfdqunyufjoyztvcti.supabase.co/rest/v1/key_check_state?select=id&limit=1', { apikey: value, ...(value.startsWith('sb_secret_') ? {} : { Authorization: `Bearer ${value}` }) });
        }
      } else if (c.kind === 'anthropic') {
        const model = env.ANTHROPIC_MODEL || 'claude-sonnet-4-5';
        if (!/^[a-zA-Z0-9_-]{1,100}$/.test(model)) return done('permission_or_resource', 'model_invalid');
        r = await request(`https://api.anthropic.com/v1/models/${model}`, { 'x-api-key': value, 'anthropic-version': '2023-06-01' });
        if (r.outcome === 'pass') return done(typeof r.body?.id === 'string' ? 'pass' : 'provider_unavailable', typeof r.body?.id === 'string' ? 'model_access_not_inference' : 'invalid_provider_payload', r.status);
      } else if (c.kind === 'stripe') {
        r = await request('https://api.stripe.com/v1/account', { Authorization: `Bearer ${value}` });
      } else if (c.kind === 'twilio') {
        if (!/^AC[a-fA-F0-9]{32}$/.test(env.TWILIO_ACCOUNT_SID || '')) return done('permission_or_resource', 'resource_missing');
        r = await request(`https://api.twilio.com/2010-04-01/Accounts/${env.TWILIO_ACCOUNT_SID}.json`, { Authorization: `Basic ${Buffer.from(`${env.TWILIO_ACCOUNT_SID}:${value}`).toString('base64')}` });
      } else if (c.kind === 'clickup') {
        r = await request('https://api.clickup.com/api/v2/user', { Authorization: value });
        if (r.outcome === 'pass') {
          const lists = [...new Set([env.CLICKUP_LIST_PALM_SPRINGS, env.CLICKUP_LIST_SAN_MIGUEL, env.CLICKUP_DEFAULT_LIST_ID].filter(Boolean))];
          if (!lists.length) return done('permission_or_resource', 'resource_missing');
          for (const id of lists.slice(0, 3)) {
            if (!/^\d+$/.test(id)) return done('permission_or_resource', 'resource_missing');
            r = await request(`https://api.clickup.com/api/v2/list/${id}`, { Authorization: value });
            if (r.outcome !== 'pass') break;
          }
        }
      } else if (c.kind === 'resend') {
        r = await request('https://api.resend.com/domains', { Authorization: `Bearer ${value}` });
        if (r.status === 401 && r.body?.name === 'restricted_api_key') return done('pass', 'restricted_key', r.status);
        if (r.outcome === 'pass') {
          const domain = (env.KEY_CHECK_EMAIL_FROM || '').split('@').pop()?.replace(/>$/, '');
          if (!r.body?.data?.some(d => d.name === domain && d.status === 'verified')) return done('permission_or_resource', 'sender_unverified', r.status);
        }
      }
      return done(r.outcome, r.detail, r.status);
    } catch { return done('provider_unavailable', 'request_failed'); }
  }
  const results = new Array(CHECKS.length);
  let index = 0;
  await Promise.all(Array.from({ length: 3 }, async () => { while (index < CHECKS.length) { const i = index++; results[i] = await run(CHECKS[i]); } }));
  return { results, ...summarize(results) };
}
