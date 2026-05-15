import { NextResponse } from 'next/server';
import { revalidateTag } from 'next/cache';
import { getAdminClient } from '@/lib/supabase/admin';
import { isOwner } from '@/lib/maintenance/owner-auth';
import { MAINTENANCE_CATEGORIES, PROPERTIES } from '@/lib/constants';

/**
 * PATCH /api/maintenance/admin/vendors/[id]
 *   Body: partial vendor — any subset of name, phone, email, specialties, markets, notes, active.
 *   Updates the row. Returns the updated record.
 *
 * DELETE /api/maintenance/admin/vendors/[id]
 *   Soft-delete: sets active=false. Use ?hard=1 query param to actually drop
 *   the row (only do this if you typo'd a vendor and want it gone from
 *   history entirely — otherwise prefer the soft-delete so triage_meta
 *   references in old tickets still resolve.)
 */

const ALLOWED_SPECIALTIES = new Set(MAINTENANCE_CATEGORIES);
const ALLOWED_MARKETS = new Set(PROPERTIES.map((p) => p.slug));

function sanitizePartial(body) {
  const update = {};
  if (typeof body.name === 'string' && body.name.trim()) update.name = body.name.trim();
  if (body.phone === null) update.phone = null;
  else if (typeof body.phone === 'string' && body.phone.trim()) {
    if (!/^\+\d{8,15}$/.test(body.phone.trim())) return { error: 'Phone must be E.164.' };
    update.phone = body.phone.trim();
  }
  if (body.email === null) update.email = null;
  else if (typeof body.email === 'string' && body.email.trim()) {
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(body.email.trim())) return { error: 'Email invalid.' };
    update.email = body.email.trim().toLowerCase();
  }
  if (Array.isArray(body.specialties)) {
    update.specialties = body.specialties.map((s) => String(s).trim()).filter((s) => ALLOWED_SPECIALTIES.has(s));
  }
  if (Array.isArray(body.markets)) {
    update.markets = body.markets.map((m) => String(m).trim().toLowerCase()).filter((m) => ALLOWED_MARKETS.has(m));
  }
  if (typeof body.notes === 'string' || body.notes === null) {
    update.notes = body.notes ? String(body.notes).trim() : null;
  }
  if (typeof body.active === 'boolean') update.active = body.active;
  return { update };
}

export async function PATCH(request, { params }) {
  const auth = await isOwner();
  if (!auth.authed) return NextResponse.json({ error: 'not found' }, { status: 404 });

  const p = params instanceof Promise ? await params : params;
  if (!p?.id) return NextResponse.json({ error: 'missing id' }, { status: 400 });

  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'bad json' }, { status: 400 });
  }

  const { update, error: sanitErr } = sanitizePartial(body);
  if (sanitErr) return NextResponse.json({ error: sanitErr }, { status: 400 });
  if (!Object.keys(update).length) return NextResponse.json({ error: 'no fields to update' }, { status: 400 });

  const supabase = getAdminClient();
  if (!supabase) return NextResponse.json({ error: 'storage not configured' }, { status: 503 });

  const { data, error } = await supabase
    .from('maintenance_vendors')
    .update(update)
    .eq('id', p.id)
    .select('*')
    .single();
  if (error) {
    // eslint-disable-next-line no-console
    console.error('[vendors] update failed:', error);
    return NextResponse.json({ error: 'update failed' }, { status: 500 });
  }
  revalidateTag('maintenance');
  return NextResponse.json({ vendor: data });
}

export async function DELETE(request, { params }) {
  const auth = await isOwner();
  if (!auth.authed) return NextResponse.json({ error: 'not found' }, { status: 404 });

  const p = params instanceof Promise ? await params : params;
  if (!p?.id) return NextResponse.json({ error: 'missing id' }, { status: 400 });

  const hard = new URL(request.url).searchParams.get('hard') === '1';

  const supabase = getAdminClient();
  if (!supabase) return NextResponse.json({ error: 'storage not configured' }, { status: 503 });

  if (hard) {
    const { error } = await supabase.from('maintenance_vendors').delete().eq('id', p.id);
    if (error) return NextResponse.json({ error: 'delete failed' }, { status: 500 });
  } else {
    const { error } = await supabase
      .from('maintenance_vendors')
      .update({ active: false })
      .eq('id', p.id);
    if (error) return NextResponse.json({ error: 'deactivate failed' }, { status: 500 });
  }
  revalidateTag('maintenance');
  return NextResponse.json({ ok: true, soft: !hard });
}
