import { NextResponse } from 'next/server';
import { revalidateTag } from 'next/cache';
import { getAdminClient } from '@/lib/supabase/admin';
import { triageMaintenance } from '@/lib/ai/triage';
import { createTask } from '@/lib/clickup/client';
import { sendSms } from '@/lib/twilio/client';
import { sendEmail, buildVendorDispatchEmail } from '@/lib/email/client';
import { generateVendorToken, appendHistory } from '@/lib/maintenance/status';
import { PROPERTIES, clickupListIdForProperty, MAINTENANCE_VENDORS_SEED, BRAND } from '@/lib/constants';

/**
 * POST /api/maintenance/intake — PUBLIC, rate-limited at the edge.
 *
 * Body:
 *   {
 *     propertySlug: 'palm-springs',
 *     description:  '<free text>',
 *     reportedBy:   'guest' | 'manager' | 'owner',
 *     reporterEmail?: '...',
 *     reporterName?:  '...',
 *     photos?: ['https://...']    // public URLs (Supabase Storage later)
 *   }
 *
 * What it does:
 *   1. Validates and looks up the property
 *   2. Pulls active vendors for the market + recent similar tickets
 *   3. Asks Claude to triage (or falls back to keyword-stub)
 *   4. Inserts a maintenance_requests row
 *   5. Creates a ClickUp task in the property's Maintenance list
 *   6. Sends a rich vendor-dispatch EMAIL to the matched vendor (with the
 *      owner BCC'd) — this is the primary notification channel while
 *      Twilio A2P 10DLC registration is pending.
 *   7. ALSO attempts an SMS via Twilio so the moment 10DLC is approved,
 *      delivery starts working without a code change. The SMS result is
 *      surfaced in the response (error code if carrier-blocked, sid if
 *      sent) so you can monitor 10DLC approval status.
 *   8. Returns a small ticket DTO + a guest-visible status URL.
 *
 * Every external dependency stubs gracefully so the route always succeeds.
 */
export async function POST(request) {
  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'bad json' }, { status: 400 });
  }
  const { propertySlug, description, reportedBy = 'guest', reporterEmail, reporterName, photos = [] } = body || {};

  if (!propertySlug || !description || description.length < 6) {
    return NextResponse.json({ error: 'propertySlug and description (>= 6 chars) required' }, { status: 400 });
  }
  const property = PROPERTIES.find((p) => p.slug === propertySlug);
  if (!property) {
    return NextResponse.json({ error: 'unknown property' }, { status: 400 });
  }

  const supabase = getAdminClient();
  // Property row + vendor roster + recent similar tickets — best-effort.
  let propertyRowId = null;
  let vendorRoster = [];
  let recentSimilar = [];
  if (supabase) {
    const { data: prop } = await supabase
      .from('properties').select('id').eq('slug', propertySlug).maybeSingle();
    propertyRowId = prop?.id || null;

    const { data: vendors } = await supabase
      .from('maintenance_vendors')
      .select('id,name,phone,email,specialties,markets,notes')
      .eq('active', true);
    vendorRoster = (vendors || []).filter((v) =>
      !v.markets?.length || v.markets.includes(propertySlug),
    );
  }

  // Fallback to constants-based seed when Supabase isn't configured OR returns
  // no vendors. Filters by market the same way as the DB-backed branch.
  if (!vendorRoster.length && MAINTENANCE_VENDORS_SEED.length) {
    vendorRoster = MAINTENANCE_VENDORS_SEED.filter((v) =>
      !v.markets?.length || v.markets.includes(propertySlug),
    );
  }

  if (supabase && propertyRowId) {
    const ninetyDaysAgo = new Date(Date.now() - 90 * 86400 * 1000).toISOString();
    const { data: prior } = await supabase
      .from('maintenance_requests')
      .select('title,category,created_at')
      .eq('property_id', propertyRowId)
      .gte('created_at', ninetyDaysAgo)
      .order('created_at', { ascending: false })
      .limit(20);
    recentSimilar = prior || [];
  }

  // Triage with Claude (or stub).
  const triage = await triageMaintenance({
    property,
    description,
    reportedBy,
    photos,
    vendorRoster,
    recentSimilar,
  });

  // Insert ticket row (skip if Supabase isn't configured; we still continue
  // so the operator at least sees a ClickUp task + SMS).
  // We pre-generate a vendor_token so the dispatch email can include the
  // vendor portal URL on first send (no follow-up update round-trip).
  const vendorToken = generateVendorToken();
  // If triage already matched a vendor, we open + auto-advance to 'assigned'
  // in a single insert so the timeline reflects the dispatch without a
  // round-trip update.
  const initialStatus = triage.matchedVendorId ? 'assigned' : 'open';
  const reporter = reportedBy === 'owner' ? 'owner' : 'guest';
  let initialHistory = appendHistory([], 'open', reporter);
  if (initialStatus === 'assigned') {
    initialHistory = appendHistory(initialHistory, 'assigned', 'system');
  }
  let ticket = null;
  if (supabase && propertyRowId) {
    const ins = {
      property_id: propertyRowId,
      title: triage.title,
      description,
      status: initialStatus,
      priority: triage.priority || 'normal',
      severity: triage.severity || null,
      category: triage.category || null,
      reporter_email: reporterEmail || null,
      vendor_id: triage.matchedVendorId || null,
      reported_by: reportedBy,
      photos,
      triage_meta: triage,
      vendor_token: vendorToken,
      status_history: initialHistory,
    };
    const { data, error } = await supabase
      .from('maintenance_requests').insert(ins).select().single();
    if (!error) ticket = data;
  }

  // Create ClickUp task.
  const listId = clickupListIdForProperty(propertySlug);
  let clickup = { stub: true, skipped: !listId, note: 'No CLICKUP list id configured.' };
  if (listId) {
    const priorityMap = { urgent: 1, high: 2, normal: 3, low: 4 };
    clickup = await createTask({
      listId,
      title: triage.title,
      description: triage.taskDescription,
      priority: priorityMap[triage.priority] || 3,
      tags: [triage.category, triage.recurringFlag ? 'recurring' : null].filter(Boolean),
    });
    // Persist the ClickUp id back to the ticket.
    if (ticket && clickup.id && supabase) {
      await supabase.from('maintenance_requests')
        .update({ clickup_task_id: clickup.id })
        .eq('id', ticket.id);
    }
  }

  const matched = vendorRoster.find((v) => v.id === triage.matchedVendorId);

  // Email to matched vendor — PRIMARY notification channel while Twilio
  // A2P 10DLC registration is pending. Owner is BCC'd for visibility.
  let email = { stub: true, skipped: true, note: 'No vendor matched / no email on file.' };
  if (matched?.email) {
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://granderson-destinations.vercel.app';
    const { subject, text, html } = buildVendorDispatchEmail({
      property,
      triage,
      description,
      reporterName,
      reporterEmail,
      ticketId: ticket?.id || null,
      statusUrl: ticket?.id ? `${siteUrl}/maintenance/status/${ticket.id}` : null,
      clickupUrl: clickup.url || null,
      vendorPortalUrl: ticket ? `${siteUrl}/maintenance/vendor/${vendorToken}` : null,
    });
    email = await sendEmail({
      to: matched.email,
      bcc: process.env.OWNER_NOTIFY_EMAIL || BRAND.contactEmail || undefined,
      replyTo: reporterEmail || BRAND.contactEmail || undefined,
      subject,
      text,
      html,
    });
    if (ticket && email.id && supabase) {
      await supabase.from('maintenance_requests')
        .update({
          vendor_email_id: email.id,
          vendor_email_sent_at: new Date().toISOString(),
        })
        .eq('id', ticket.id);
    }
  }

  // Twilio SMS to matched vendor (if any + phone present). Will fail with
  // carrier error 30034 until A2P 10DLC is approved. We attempt anyway so
  // the moment 10DLC clears, SMS resumes without a code change. The error
  // note is surfaced in the response for diagnostic visibility.
  let sms = { stub: true, skipped: true, note: 'No vendor matched / no phone on file.' };
  if (matched?.phone) {
    sms = await sendSms({ to: matched.phone, body: triage.vendorMessage });
    if (ticket && sms.sid && supabase) {
      await supabase.from('maintenance_requests')
        .update({ vendor_sms_sid: sms.sid, vendor_sms_sent_at: new Date().toISOString() })
        .eq('id', ticket.id);
    }
  }

  revalidateTag('maintenance');

  return NextResponse.json({
    ok: true,
    ticketId: ticket?.id || null,
    statusUrl: ticket?.id ? `/maintenance/status/${ticket.id}` : null,
    triage: {
      title: triage.title,
      category: triage.category,
      severity: triage.severity,
      priority: triage.priority,
      vendor: matched ? { id: matched.id, name: matched.name } : null,
      recurringFlag: !!triage.recurringFlag,
      reasoning: triage.reasoning,
      stub: !!triage.stub,
    },
    clickup: {
      id: clickup.id || null,
      url: clickup.url || null,
      stub: !!clickup.stub,
      note: clickup.note || clickup.error || null,
    },
    email: {
      id: email.id || null,
      stub: !!email.stub,
      to: matched?.email || null,
      note: email.note || email.error || null,
    },
    sms: {
      sid: sms.sid || null,
      stub: !!sms.stub,
      to: matched?.phone || null,
      note: sms.note || sms.error || null,
    },
    reporterName: reporterName || null,
  });
}
