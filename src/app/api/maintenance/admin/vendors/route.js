import { NextResponse } from 'next/server';
import { revalidateTag } from 'next/cache';
import { getAdminClient } from '@/lib/supabase/admin';
import { isOwner } from '@/lib/maintenance/owner-auth';
import { MAINTENANCE_CATEGORIES, PROPERTIES } from '@/lib/constants';

/**
 * GET /api/maintenance/admin/vendors
 *   List every vendor (active + inactive). Owner-only.
 *
 * POST /api/maintenance/admin/vendors
 *   Body: { name, phone, email, specialties, markets, notes, active }
 *   Creates one vendor. Returns the new row.
 *   Soft-dedupe: if a vendor with the same email already exists, we 409 with
 *   a hint to PATCH that row instead.
 */

const ALLOWED_SPECIALTIES = new Set(MAINTENANCE_CATEGORIES);
const ALLOWED_MARKETS = new Set(PROPERTIES.map((p) => p.slug));

function validateRow(body) {
  if (!body || typeof body !== 'object') return 'Body must be an object.';
  if (!body.name || typeof body.name !== 'string' || !body.name.trim()) return 'Name is required.';
  if (body.email != null && body.email !== '' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(body.email)) {
    return 'Email is not a valid address.';
  }
  if (body.phone != null && body.phone !== '' && !/^\+\d{8,15}$/.test(body.phone)) {
    return 'Phone must be E.164 format (e.g. +17605551234).';
  }
  if (body.specialties != null && !Array.isArray(body.specialties)) return 'Specialties must be an array.';
  if (body.markets != null && !Array.isArray(body.markets)) return 'Markets must be an array.';
  return null;
}

function sanitizeRow(body) {
  // Strip unknown specialties and markets — silently drop with no error so
  // the caller's input is preserved as much as possible.
  const specialties = (body.specialties || [])
    .map((s) => String(s).trim())
    .filter((s) => ALLOWED_SPECIALTIES.has(s));
  const markets = (body.markets || [])
    .map((m) => String(m).trim().toLowerCase())
    .filter((m) => ALLOWED_MARKETS.has(m));
  return {
    name: body.name.trim().slice(0, 200),
    phone: body.phone ? body.phone.trim() : null,
    email: body.email ? body.email.trim().toLowerCase() : null,
    specialties,
    markets,
    notes: body.notes ? String(body.notes).trim().slice(0, 2000) : null,
    active: body.active !== false, // default true
  };
}

export async function GET() {
  const auth = await isOwner();
  if (!auth.authed) return NextResponse.json({ error: 'not found' }, { status: 404 });

  const supabase = getAdminClient();
  if (!supabase) return NextResponse.json({ error: 'storage not configured' }, { status: 503 });

  const { data, error } = await supabase
    .from('maintenance_vendors')
    .select('id,name,phone,email,specialties,markets,notes,active,last_used_at,performance_score,created_at,updated_at')
    .order('active', { ascending: false })
    .order('name', { ascending: true });
  if (error) {
    // eslint-disable-next-line no-console
    console.error('[vendors] list failed:', error);
    return NextResponse.json({ error: 'query failed' }, { status: 500 });
  }
  return NextResponse.json({ vendors: data || [] });
}

export async function POST(request) {
  const auth = await isOwner();
  if (!auth.authed) return NextResponse.json({ error: 'not found' }, { status: 404 });

  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'bad json' }, { status: 400 });
  }

  const validationError = validateRow(body);
  if (validationError) return NextResponse.json({ error: validationError }, { status: 400 });

  const supabase = getAdminClient();
  if (!supabase) return NextResponse.json({ error: 'storage not configured' }, { status: 503 });

  const row = sanitizeRow(body);

  // Soft-dedup: if email matches an existing vendor, refuse so we don't
  // silently create dupes. The client can choose to PATCH the existing row.
  if (row.email) {
    const { data: existing } = await supabase
      .from('maintenance_vendors')
      .select('id,name')
      .eq('email', row.email)
      .maybeSingle();
    if (existing) {
      return NextResponse.json(
        { error: `A vendor with email ${row.email} already exists ("${existing.name}").`, conflictId: existing.id },
        { status: 409 },
      );
    }
  }

  const { data, error } = await supabase
    .from('maintenance_vendors')
    .insert(row)
    .select('*')
    .single();
  if (error) {
    // eslint-disable-next-line no-console
    console.error('[vendors] insert failed:', error);
    return NextResponse.json({ error: 'insert failed', detail: String(error.message || error) }, { status: 500 });
  }

  revalidateTag('maintenance');
  return NextResponse.json({ vendor: data }, { status: 201 });
}
