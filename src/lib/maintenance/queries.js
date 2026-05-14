import 'server-only';
import { getAdminClient } from '@/lib/supabase/admin';
import { PROPERTIES, MAINTENANCE_VENDORS_SEED } from '@/lib/constants';

/**
 * Fetch a single ticket by its UUID (for the public /maintenance/status/[id]
 * page). Returns a denormalized view with the property + vendor stitched in
 * from constants so the page works even if the vendor record was deleted.
 *
 * Returns null if not found OR if Supabase isn't configured (which means
 * we're in stub mode and there are no real tickets to look up).
 */
export async function getTicketById(id) {
  const supabase = getAdminClient();
  if (!supabase || !id) return null;

  // Public guest view — explicit column list, owner_notes intentionally omitted.
  // reporter_email is included for the page to optionally show "we'll email you
  // at <addr>", but it isn't currently rendered.
  const { data: ticket } = await supabase
    .from('maintenance_requests')
    .select(
      'id,title,description,status,priority,severity,category,created_at,reporter_email,' +
        'vendor_id,reported_by,photos,triage_meta,vendor_notes,cost_estimate_cents,' +
        'cost_final_cents,status_history,eta_at,clickup_task_id,property_id',
    )
    .eq('id', id)
    .maybeSingle();

  if (!ticket) return null;

  // Resolve property name via the slug → constants lookup. The DB stores
  // property_id (uuid) but we don't have a join the easy way here; load
  // the property row and find the matching slug in constants.
  let property = null;
  if (ticket.property_id) {
    const { data: prow } = await supabase
      .from('properties').select('slug,name,city,region').eq('id', ticket.property_id).maybeSingle();
    if (prow) {
      property = PROPERTIES.find((p) => p.slug === prow.slug) || prow;
    }
  }

  // Vendor: try DB first, fall back to seed.
  let vendor = null;
  if (ticket.vendor_id) {
    const { data: vrow } = await supabase
      .from('maintenance_vendors')
      .select('id,name,phone,email,specialties').eq('id', ticket.vendor_id).maybeSingle();
    vendor = vrow || null;
  }
  // If we have a matchedVendorId in triage_meta and it points at a seed vendor,
  // resolve that — the self-test entry doesn't exist in the DB.
  if (!vendor && ticket.triage_meta?.matchedVendorId) {
    vendor = MAINTENANCE_VENDORS_SEED.find((v) => v.id === ticket.triage_meta.matchedVendorId) || null;
    if (vendor) vendor = { ...vendor, phone: null, email: null }; // strip PII for guest view
  }

  return { ...ticket, property, vendor };
}

/**
 * Fetch ticket by vendor_token — for the vendor portal at /maintenance/vendor/[token].
 * Tokens are unique per ticket so this is also a one-row lookup.
 */
export async function getTicketByVendorToken(token) {
  const supabase = getAdminClient();
  if (!supabase || !token) return null;

  // Explicit column list — we deliberately omit owner_notes, reporter_email,
  // vendor_sms_sid, and vendor_email_id from the vendor view so the RSC props
  // never carry them. Any future template change can't accidentally render
  // owner-private fields to the vendor.
  const { data: ticket } = await supabase
    .from('maintenance_requests')
    .select(
      'id,title,description,status,priority,severity,category,created_at,' +
        'vendor_id,reported_by,photos,triage_meta,vendor_notes,' +
        'cost_estimate_cents,cost_final_cents,status_history,eta_at,' +
        'property_id,clickup_task_id,vendor_token',
    )
    .eq('vendor_token', token)
    .maybeSingle();

  if (!ticket) return null;

  let property = null;
  if (ticket.property_id) {
    const { data: prow } = await supabase
      .from('properties').select('slug,name,city,region').eq('id', ticket.property_id).maybeSingle();
    if (prow) property = PROPERTIES.find((p) => p.slug === prow.slug) || prow;
  }

  let vendor = null;
  if (ticket.vendor_id) {
    const { data: vrow } = await supabase
      .from('maintenance_vendors').select('id,name,phone,email').eq('id', ticket.vendor_id).maybeSingle();
    vendor = vrow;
  }
  if (!vendor && ticket.triage_meta?.matchedVendorId) {
    vendor = MAINTENANCE_VENDORS_SEED.find((v) => v.id === ticket.triage_meta.matchedVendorId) || null;
  }

  return { ...ticket, property, vendor };
}

/**
 * Fetch every ticket for the admin dashboard. Most recent first. We pull a
 * generous limit (500) and filter client-side because volume is low — at
 * scale we'd paginate.
 */
export async function listAllTickets({ limit = 500 } = {}) {
  const supabase = getAdminClient();
  if (!supabase) return [];

  const { data: tickets } = await supabase
    .from('maintenance_requests')
    .select(
      'id,title,description,status,priority,severity,category,created_at,' +
        'vendor_id,reported_by,triage_meta,cost_estimate_cents,cost_final_cents,' +
        'status_history,property_id,clickup_task_id,vendor_token',
    )
    .order('created_at', { ascending: false })
    .limit(limit);

  if (!tickets?.length) return [];

  // Hydrate property + vendor names. Single queries since N is small.
  const { data: props } = await supabase.from('properties').select('id,slug,name,city');
  const propsById = new Map((props || []).map((p) => [p.id, p]));
  const { data: vendors } = await supabase
    .from('maintenance_vendors').select('id,name,phone,email');
  const vendorsById = new Map((vendors || []).map((v) => [v.id, v]));

  return tickets.map((t) => {
    let property = null;
    if (t.property_id) {
      const prow = propsById.get(t.property_id);
      if (prow) property = PROPERTIES.find((p) => p.slug === prow.slug) || prow;
    }
    let vendor = null;
    if (t.vendor_id) {
      vendor = vendorsById.get(t.vendor_id) || null;
    }
    if (!vendor && t.triage_meta?.matchedVendorId) {
      vendor = MAINTENANCE_VENDORS_SEED.find((v) => v.id === t.triage_meta.matchedVendorId) || null;
    }
    return { ...t, property, vendor };
  });
}

/**
 * Cheap aggregate stats for the admin dashboard KPI tiles. Computed in JS
 * over the same ticket list (no extra round-trips).
 */
export function summarizeTickets(tickets) {
  const buckets = {
    open: 0,
    in_progress: 0,
    awaiting_owner: 0,
    closed_this_week: 0,
    open_spend_cents: 0,
  };
  const oneWeekAgo = Date.now() - 7 * 86_400_000;
  for (const t of tickets) {
    if (t.status === 'open' || t.status === 'assigned') buckets.open += 1;
    if (t.status === 'in_progress' || t.status === 'diagnosed') buckets.in_progress += 1;
    if (t.status === 'awaiting_owner') buckets.awaiting_owner += 1;
    if (
      (t.status === 'complete' || t.status === 'closed') &&
      new Date(t.created_at).getTime() >= oneWeekAgo
    ) {
      buckets.closed_this_week += 1;
    }
    if (t.status !== 'closed' && t.status !== 'complete') {
      buckets.open_spend_cents += t.cost_estimate_cents || 0;
    }
  }
  return buckets;
}
