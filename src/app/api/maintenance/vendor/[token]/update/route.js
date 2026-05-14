import { NextResponse } from 'next/server';
import { revalidateTag } from 'next/cache';
import { getAdminClient } from '@/lib/supabase/admin';
import { STATUSES, VENDOR_TRANSITIONS, appendHistory } from '@/lib/maintenance/status';

/**
 * POST /api/maintenance/vendor/[token]/update
 *
 * Body (all optional, but at least one required):
 *   {
 *     status?: 'in_progress' | 'diagnosed' | ...   // must be in allowed transitions
 *     vendorNotes?: '<text>'
 *     costEstimateCents?: 12345                     // integer cents
 *     costFinalCents?: 12345
 *     etaAt?: '2026-05-14T18:00:00Z'                // ISO8601
 *   }
 *
 * Auth: the URL token itself is the only credential. No header/session.
 * Vendors are expected to bookmark or click their unique dispatch link.
 */
export async function POST(request, { params }) {
  const p = params instanceof Promise ? await params : params;
  const token = p?.token;
  if (!token) return NextResponse.json({ error: 'missing token' }, { status: 400 });

  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'bad json' }, { status: 400 });
  }

  const supabase = getAdminClient();
  if (!supabase) {
    return NextResponse.json({ error: 'storage not configured' }, { status: 503 });
  }

  // Pull the ticket (we need current status to validate transitions).
  const { data: ticket, error: fetchErr } = await supabase
    .from('maintenance_requests')
    .select('id,status,status_history,vendor_token')
    .eq('vendor_token', token)
    .maybeSingle();
  if (fetchErr || !ticket) {
    return NextResponse.json({ error: 'ticket not found' }, { status: 404 });
  }

  const update = {};
  const history = ticket.status_history || [];

  if (body.status) {
    if (!STATUSES.includes(body.status)) {
      return NextResponse.json({ error: 'invalid status' }, { status: 400 });
    }
    const allowed = VENDOR_TRANSITIONS[ticket.status] || [];
    if (!allowed.includes(body.status)) {
      return NextResponse.json(
        {
          error: `transition not allowed from ${ticket.status} → ${body.status}`,
          allowed,
        },
        { status: 409 },
      );
    }
    update.status = body.status;
    update.status_history = appendHistory(history, body.status, 'vendor');
  }

  if (typeof body.vendorNotes === 'string') {
    update.vendor_notes = body.vendorNotes.slice(0, 5000) || null;
  }
  if (body.costEstimateCents === null) {
    update.cost_estimate_cents = null;
  } else if (Number.isInteger(body.costEstimateCents) && body.costEstimateCents >= 0) {
    update.cost_estimate_cents = body.costEstimateCents;
  } else if (body.costEstimateCents !== undefined) {
    return NextResponse.json({ error: 'costEstimateCents must be a non-negative integer or null' }, { status: 400 });
  }
  if (body.costFinalCents === null) {
    update.cost_final_cents = null;
  } else if (Number.isInteger(body.costFinalCents) && body.costFinalCents >= 0) {
    update.cost_final_cents = body.costFinalCents;
  } else if (body.costFinalCents !== undefined) {
    return NextResponse.json({ error: 'costFinalCents must be a non-negative integer or null' }, { status: 400 });
  }
  if (body.etaAt === null) {
    update.eta_at = null;
  } else if (typeof body.etaAt === 'string') {
    const parsed = new Date(body.etaAt);
    if (Number.isNaN(parsed.getTime())) {
      return NextResponse.json({ error: 'etaAt must be a valid ISO8601 timestamp or null' }, { status: 400 });
    }
    update.eta_at = parsed.toISOString();
  }

  if (!Object.keys(update).length) {
    return NextResponse.json({ error: 'no updates supplied' }, { status: 400 });
  }

  const { data, error } = await supabase
    .from('maintenance_requests')
    .update(update)
    .eq('id', ticket.id)
    .select('id,status,vendor_notes,cost_estimate_cents,cost_final_cents,eta_at,status_history')
    .single();
  if (error) {
    return NextResponse.json({ error: 'update failed', detail: String(error.message || error) }, { status: 500 });
  }

  revalidateTag('maintenance');
  return NextResponse.json({ ok: true, ticket: data });
}
