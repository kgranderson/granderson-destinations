import { NextResponse } from 'next/server';
import { revalidateTag } from 'next/cache';
import { withAdmin } from '@/lib/auth/admin';
import { getAdminClient } from '@/lib/supabase/admin';

/**
 * POST /api/maintenance
 *   Body: { propertySlug, title, description, priority, category,
 *           reporter_email, vendor_assigned, estimated_cost,
 *           scheduled_for, notes }
 */
export const POST = withAdmin(async (request) => {
  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'bad json' }, { status: 400 });
  }
  const { propertySlug, title, ...rest } = body;
  if (!propertySlug || !title) {
    return NextResponse.json({ error: 'propertySlug + title required' }, { status: 400 });
  }
  const supabase = getAdminClient();
  if (!supabase) return NextResponse.json({ error: 'no db' }, { status: 500 });

  const { data: prop } = await supabase
    .from('properties').select('id').eq('slug', propertySlug).maybeSingle();
  if (!prop?.id) return NextResponse.json({ error: 'unknown property' }, { status: 400 });

  const insert = {
    property_id: prop.id,
    title,
    description: rest.description || null,
    priority: rest.priority || 'normal',
    category: rest.category || null,
    reporter_email: rest.reporter_email || null,
    vendor_assigned: rest.vendor_assigned || null,
    vendor_contact: rest.vendor_contact || null,
    estimated_cost: rest.estimated_cost ?? null,
    scheduled_for: rest.scheduled_for || null,
    notes: rest.notes || null,
    status: 'open',
  };
  const { data, error } = await supabase
    .from('maintenance_requests').insert(insert).select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  revalidateTag('maintenance');
  return NextResponse.json({ ok: true, request: data });
});
