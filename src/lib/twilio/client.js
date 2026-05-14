import 'server-only';
/**
 * Twilio SMS client for maintenance vendor notifications.
 *
 * Stub mode (no TWILIO_ACCOUNT_SID or no TWILIO_AUTH_TOKEN): logs to
 * stdout and returns a fake message id so the maintenance pipeline runs
 * end-to-end without keys. Owner gets a server-log entry instead of an SMS.
 *
 * Docs: https://www.twilio.com/docs/messaging/api/message-resource
 */
import { FEATURE_FLAGS } from '@/lib/constants';

const BASE = 'https://api.twilio.com/2010-04-01';

/**
 * Send a single SMS.
 *   to:   recipient phone, E.164 format (+17605551234)
 *   body: <= 1600 chars; Twilio splits into segments at 160 chars
 *   from: optional override; defaults to TWILIO_FROM_NUMBER
 */
export async function sendSms({ to, body, from }) {
  if (!FEATURE_FLAGS.twilioLive()) {
    // eslint-disable-next-line no-console
    console.log('[twilio:stub]', { to, from: from || process.env.TWILIO_FROM_NUMBER, body });
    return { stub: true, sid: `SMstub_${Date.now().toString(36)}`, to, body };
  }
  const sid = process.env.TWILIO_ACCOUNT_SID;
  const token = process.env.TWILIO_AUTH_TOKEN;
  const sender = from || process.env.TWILIO_FROM_NUMBER;
  if (!sender) {
    return { stub: true, error: 'TWILIO_FROM_NUMBER missing.' };
  }

  const auth = Buffer.from(`${sid}:${token}`).toString('base64');
  const params = new URLSearchParams({ To: to, From: sender, Body: body });

  let res;
  try {
    res = await fetch(`${BASE}/Accounts/${sid}/Messages.json`, {
      method: 'POST',
      headers: {
        Authorization: `Basic ${auth}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: params.toString(),
    });
  } catch (err) {
    return { stub: true, error: `Network: ${String(err)}` };
  }
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    return { stub: true, error: `Twilio ${res.status}: ${text.slice(0, 250)}` };
  }
  const data = await res.json();
  return { stub: false, sid: data.sid, status: data.status, to: data.to, body: data.body };
}

/**
 * Send the same message to many vendors (e.g., bidding flow).
 * Returns the result array, one per recipient.
 */
export async function sendSmsBatch({ recipients, body }) {
  const results = [];
  for (const to of recipients) {
    // sequential — Twilio rate-limits and our batches are small.
    // eslint-disable-next-line no-await-in-loop
    results.push(await sendSms({ to, body }));
  }
  return results;
}
