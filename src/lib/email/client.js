import 'server-only';
import nodemailer from 'nodemailer';
import { FEATURE_FLAGS, BRAND } from '@/lib/constants';

/**
 * Gmail SMTP email client for the maintenance dispatch pipeline.
 *
 * Why Gmail (not Resend/SendGrid)?  This is the interim bridge while
 * Twilio A2P 10DLC registration is pending. Once the Brand + Campaign
 * are approved, SMS regains primacy and email continues as a parallel
 * notification — no code change required.
 *
 * Auth: Gmail requires an App Password (not the account password).
 * The user must enable 2-Step Verification, then create an App Password
 * at https://myaccount.google.com/apppasswords. Set GMAIL_USER (the
 * full Gmail address) and GMAIL_APP_PASSWORD (the 16-char app password,
 * spaces or no spaces — Gmail accepts both).
 *
 * Stub mode: when keys are missing or FEATURE_FLAGS.gmailLive() is
 * false, sendEmail() logs to stdout and returns a fake message id so
 * the maintenance pipeline always runs end-to-end.
 */

let _transport = null;

function getTransport() {
  if (_transport) return _transport;
  const user = process.env.GMAIL_USER;
  const pass = process.env.GMAIL_APP_PASSWORD?.replace(/\s+/g, ''); // tolerate spaces
  if (!user || !pass) return null;
  _transport = nodemailer.createTransport({
    service: 'gmail',
    auth: { user, pass },
    pool: false, // serverless — don't keep connections alive
    connectionTimeout: 8000,
    socketTimeout: 8000,
  });
  return _transport;
}

/**
 * Send a single email.
 *   to:        primary recipient (string or string[])
 *   subject:   line, <= ~120 chars to render well in clients
 *   text:      plain-text body (always include — many clients prefer it)
 *   html:      optional HTML body (rendered when client supports it)
 *   cc / bcc:  optional secondary recipients
 *   replyTo:   override the reply address (defaults to GMAIL_USER)
 */
export async function sendEmail({ to, subject, text, html, cc, bcc, replyTo }) {
  if (!FEATURE_FLAGS.gmailLive()) {
    // eslint-disable-next-line no-console
    console.log('[email:stub]', { to, subject, text: text?.slice(0, 200) });
    return { stub: true, id: `EMstub_${Date.now().toString(36)}`, to };
  }
  const transport = getTransport();
  if (!transport) {
    return { stub: true, error: 'GMAIL_USER or GMAIL_APP_PASSWORD missing.' };
  }
  try {
    const info = await transport.sendMail({
      from: `"${BRAND.name}" <${process.env.GMAIL_USER}>`,
      to,
      cc: cc || undefined,
      bcc: bcc || undefined,
      replyTo: replyTo || process.env.GMAIL_USER,
      subject,
      text,
      html: html || undefined,
    });
    return {
      stub: false,
      id: info.messageId,
      accepted: info.accepted,
      rejected: info.rejected,
      response: info.response,
    };
  } catch (err) {
    return { stub: true, error: `SMTP: ${String(err.message || err).slice(0, 250)}` };
  }
}

/**
 * Render a clean HTML maintenance dispatch email for vendors. Plain-text
 * version is always supplied to sendEmail() in parallel — many vendors
 * read SMS-style alerts on phones where text/plain renders better.
 */
export function buildVendorDispatchEmail({
  property,
  triage,
  description,
  reporterName,
  reporterEmail,
  ticketId,
  statusUrl,
  clickupUrl,
  vendorPortalUrl,
}) {
  const propertyName = property?.name || 'Property';
  const propertyCity = property?.city || '';
  const title = triage?.title || 'Maintenance request';
  const category = triage?.category || 'Maintenance';
  const severity = triage?.severity != null ? `${triage.severity}/5` : 'TBD';
  const priority = triage?.priority || 'normal';
  const reason = triage?.reasoning || '';
  const vendorMsg = triage?.vendorMessage || `New maintenance request at ${propertyName}: ${title}`;

  const subject = `[${BRAND.name}] ${propertyName} — ${title} (${priority.toUpperCase()})`;

  const lines = [
    vendorMsg,
    '',
    '— Details —',
    `Property: ${propertyName}${propertyCity ? ', ' + propertyCity : ''}`,
    `Category: ${category}`,
    `Severity: ${severity}  ·  Priority: ${priority}`,
    `Guest description: ${description}`,
    reporterName ? `Reported by: ${reporterName}` : null,
    reporterEmail ? `Contact: ${reporterEmail}` : null,
    ticketId ? `Ticket ID: ${ticketId}` : null,
    vendorPortalUrl ? `Update status here (vendor portal): ${vendorPortalUrl}` : null,
    vendorPortalUrl ? '⚠️  Do not forward this email — the vendor-portal link above is the only credential for this ticket.' : null,
    statusUrl ? `Status link (guest view): ${statusUrl}` : null,
    clickupUrl ? `ClickUp task: ${clickupUrl}` : null,
    reason ? '' : null,
    reason ? `Why we routed this to you: ${reason}` : null,
    '',
    `— ${BRAND.name}`,
  ].filter(Boolean);
  const text = lines.join('\n');

  // Lightweight HTML — every inline style so it survives every email client.
  const html = `
    <div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#0E1116;max-width:560px;margin:0 auto;padding:24px;background:#FAFAF7;">
      <div style="border:1px solid #E8DCC6;background:#FFFFFF;border-radius:14px;padding:28px;">
        <p style="margin:0 0 4px 0;font-size:11px;letter-spacing:.32em;text-transform:uppercase;color:#5E7C6B;">Maintenance dispatch · ${escapeHtml(priority)}</p>
        <h1 style="margin:0 0 12px 0;font-size:22px;line-height:1.25;color:#0E1116;">${escapeHtml(title)}</h1>
        <p style="margin:0 0 16px 0;color:#3F4A56;line-height:1.55;">${escapeHtml(vendorMsg)}</p>

        <table style="width:100%;border-collapse:collapse;margin:14px 0;font-size:14px;color:#0E1116;">
          <tr><td style="padding:6px 0;width:140px;color:#3F4A56;">Property</td><td style="padding:6px 0;font-weight:600;">${escapeHtml(propertyName)}${propertyCity ? ', ' + escapeHtml(propertyCity) : ''}</td></tr>
          <tr><td style="padding:6px 0;color:#3F4A56;">Category</td><td style="padding:6px 0;font-weight:600;">${escapeHtml(category)}</td></tr>
          <tr><td style="padding:6px 0;color:#3F4A56;">Severity / Priority</td><td style="padding:6px 0;font-weight:600;">${escapeHtml(severity)} · ${escapeHtml(priority)}</td></tr>
          ${reporterName ? `<tr><td style="padding:6px 0;color:#3F4A56;">Reported by</td><td style="padding:6px 0;font-weight:600;">${escapeHtml(reporterName)}</td></tr>` : ''}
          ${reporterEmail ? `<tr><td style="padding:6px 0;color:#3F4A56;">Contact</td><td style="padding:6px 0;font-weight:600;"><a href="mailto:${escapeHtml(reporterEmail)}" style="color:#C6633C;">${escapeHtml(reporterEmail)}</a></td></tr>` : ''}
          ${ticketId ? `<tr><td style="padding:6px 0;color:#3F4A56;">Ticket</td><td style="padding:6px 0;font-weight:600;">${escapeHtml(ticketId)}</td></tr>` : ''}
        </table>

        <div style="padding:14px;background:#F5EFE6;border-radius:10px;margin:14px 0;font-size:13px;color:#3F4A56;line-height:1.55;">
          <strong style="display:block;color:#0E1116;margin-bottom:6px;">Guest description</strong>
          ${escapeHtml(description)}
        </div>

        ${reason ? `<p style="margin:14px 0 0 0;font-size:12px;font-style:italic;color:#5E7C6B;line-height:1.5;">Why we routed this to you: ${escapeHtml(reason)}</p>` : ''}

        ${vendorPortalUrl ? `<p style="margin:18px 0 6px 0;font-size:12px;color:#854F0B;padding:8px 12px;background:#FAEEDA;border-radius:8px;line-height:1.5;"><strong>Do not forward this email.</strong> The vendor-portal link below is the only credential for this ticket — anyone with the URL can update its status. If you want to delegate, log in first and reply STOP, or contact the owner.</p>` : ''}
        <div style="margin-top:14px;display:flex;gap:10px;flex-wrap:wrap;">
          ${vendorPortalUrl ? `<a href="${vendorPortalUrl}" style="display:inline-block;background:#0E1116;color:#FAFAF7;padding:10px 18px;border-radius:999px;text-decoration:none;font-size:13px;">Update status &amp; submit estimate</a>` : ''}
          ${clickupUrl ? `<a href="${clickupUrl}" style="display:inline-block;border:1px solid #0E1116;color:#0E1116;padding:10px 18px;border-radius:999px;text-decoration:none;font-size:13px;">Open ClickUp task</a>` : ''}
        </div>

        <hr style="border:none;border-top:1px solid #E8DCC6;margin:24px 0 16px 0;" />
        <p style="margin:0;font-size:12px;color:#3F4A56;line-height:1.5;">
          Sent automatically by ${escapeHtml(BRAND.name)} maintenance triage.<br/>
          Reply to this email to coordinate with the property owner.
        </p>
      </div>
    </div>
  `;

  return { subject, text, html };
}

function escapeHtml(s) {
  if (s == null) return '';
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
