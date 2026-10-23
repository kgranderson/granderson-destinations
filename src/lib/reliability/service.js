import 'server-only';
import { createHash, randomUUID } from 'node:crypto';
import { getAdminClient } from '@/lib/supabase/admin';
import { checkKeys, productionEnabled, versionTag, summarize } from './core.mjs';

export async function audit(action, auth) {
  const db = getAdminClient();
  if (!db) return;
  await db.from('admin_audit_events').insert({ action, actor_id: auth?.user?.id || null, auth_method: auth?.via || 'cron' });
}
export async function claimJob(key, seconds = 600) {
  const db = getAdminClient();
  if (!db) throw new Error('storage_unavailable');
  const { data, error } = await db.rpc('gd_claim_job', { p_key: key, p_seconds: seconds });
  if (error) throw new Error('storage_unavailable');
  return data === true;
}
function pacificDay(date) { return new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Los_Angeles' }).format(date); }
async function sendNotice(id, payload) {
  if (!process.env.RESEND_API_KEY || !process.env.KEY_CHECK_EMAIL_FROM) return false;
  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST', redirect: 'error', signal: AbortSignal.timeout(8000),
      headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY}`, 'Content-Type': 'application/json', 'Idempotency-Key': `gd-keycheck-${id}` },
      body: JSON.stringify({ from: process.env.KEY_CHECK_EMAIL_FROM, to: ['kgranderson@mac.com'], ...payload }),
    });
    return response.ok;
  } catch { return false; }
}
export async function runKeyCheck(auth) {
  if (!productionEnabled(process.env)) return { code: 'disabled', status: 409 };
  const started = new Date();
  const day = pacificDay(started);
  let claimed;
  try { claimed = await claimJob('key-check', 600); }
  catch {
    await sendNotice(`state-unavailable-${day}`, { subject: 'Granderson Destinations key check: state unavailable', text: 'The key checker cannot access its state. Check database availability and the migration. No key values are included in this message.' });
    return { code: 'storage_unavailable', status: 503 };
  }
  if (!claimed) return { code: 'cooldown', status: 429 };
  const db = getAdminClient();
  const result = await checkKeys(process.env);
  // Per-property Meta tokens are deliberately presence-only; never query the public property column.
  const { data: tokens, error: tokenError } = await db.from('property_integrations').select('property_id,ig_access_token,ig_token_expires_at');
  if (tokenError) result.results.push({ id: 'meta_property_storage', label: 'Property token storage', outcome: 'provider_unavailable', detail: 'storage_unavailable', version_tag: null });
  for (const t of tokens || []) {
    const expired = t.ig_token_expires_at && Date.parse(t.ig_token_expires_at) <= Date.now();
    result.results.push({ id: `meta_${t.property_id.replaceAll('-','')}`, label: 'Property Instagram token', outcome: t.ig_access_token ? (expired ? 'invalid_auth' : 'configured') : 'skipped', detail: expired ? 'token_expired' : t.ig_access_token ? 'presence_only' : 'not_configured', version_tag: versionTag(t.ig_access_token, process.env.KEY_CHECK_VERSION_SALT) });
  }
  Object.assign(result, summarize(result.results));
  const run = { id: randomUUID(), started_at: started.toISOString(), deployment_id: (process.env.VERCEL_DEPLOYMENT_ID || process.env.VERCEL_GIT_COMMIT_SHA || 'unknown').replace(/[^A-Za-z0-9_-]/g, '').slice(0, 80), ...result };
  const { error } = await db.from('key_check_runs').insert(run);
  if (error) return { code: 'storage_unavailable', status: 503 };
  await audit('key_check_run', auth);
  const fingerprint = createHash('sha256').update(JSON.stringify(run.results.map(r => [r.id,r.outcome,r.detail,r.version_tag]))).digest('hex');
  const { data: state } = await db.from('key_check_state').select('fingerprint,notified_day').eq('id', 1).single();
  const monday = new Intl.DateTimeFormat('en-US', { weekday: 'short', timeZone: 'America/Los_Angeles' }).format(started) === 'Mon';
  if (state && (state.fingerprint !== fingerprint || (!run.healthy && state.notified_day !== day) || (monday && state.notified_day !== day))) {
    const id = `${day}-${fingerprint.slice(0, 16)}`;
    const payload = { subject: `Granderson Destinations key check: ${run.healthy ? 'healthy' : 'attention needed'}`, text: `${run.started_at}\n${run.results.map(r => `${r.label}: ${r.outcome} (${r.detail})`).join('\n')}\nReview: https://www.grandersondestinations.com/admin/keys\nNo key values are included in this message.` };
    const { error: queued } = await db.from('key_check_notices').upsert({ id, payload }, { onConflict: 'id', ignoreDuplicates: true });
    if (!queued) await db.from('key_check_state').update({ fingerprint, notified_day: day }).eq('id',1);
  }
  // Frozen bodies + provider idempotency make a failed send safe to retry within 24 hours.
  const { data: pending } = await db.from('key_check_notices').select('id,payload,created_at').is('sent_at',null).gte('created_at',new Date(Date.now()-23*3600000).toISOString()).limit(3);
  for (const notice of pending || []) if (await sendNotice(notice.id, notice.payload)) await db.from('key_check_notices').update({ sent_at: new Date().toISOString() }).eq('id',notice.id);
  const cutoff = new Date(Date.now()-90*86400000).toISOString();
  await db.from('key_check_runs').delete().lt('started_at',cutoff);
  await db.from('key_check_notices').delete().lt('created_at',cutoff);
  return { code: 'complete', status: run.healthy ? 200 : 503, run };
}
export async function latestRuns() {
  const db = getAdminClient();
  if (!db) return { runs: [], code: 'storage_unavailable' };
  const { data, error } = await db.from('key_check_runs').select('*').order('started_at', { ascending: false }).limit(30);
  return { runs: data || [], code: error ? 'storage_unavailable' : null };
}
