import { NextResponse } from 'next/server';
import { revalidateTag } from 'next/cache';
import { getAdminClient } from '@/lib/supabase/admin';
import { isOwner } from '@/lib/maintenance/owner-auth';

/**
 * POST /api/maintenance/admin/notes
 * Body: { ticketId: '<uuid>', ownerNotes: '<text>' }
 *
 * Owner-only. Auth is read from the gd_owner cookie (set when the owner
 * visits /maintenance/admin?key=...).
 */
export async function POST(request) {
  const auth = await isOwner();
  if (!auth.authed) {
    // 404 (not 401) so this endpoint doesn't reveal itself to attackers.
    return NextResponse.json({ error: 'not found' }, { status: 404 });
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'bad json' }, { status: 400 });
  }
  const { ticketId, ownerNotes } = body || {};
  if (!ticketId || typeof ownerNotes !== 'string') {
    return NextResponse.json({ error: 'ticketId and ownerNotes required' }, { status: 400 });
  }

  const supabase = getAdminClient();
  if (!supabase) {
    return NextResponse.json({ error: 'storage not configured' }, { status: 503 });
  }

  const { error } = await supabase
    .from('maintenance_requests')
    .update({ owner_notes: ownerNotes.slice(0, 5000) || null })
    .eq('id', ticketId);
  if (error) {
    return NextResponse.json({ error: 'update failed' }, { status: 500 });
  }

  revalidateTag('maintenance');
  return NextResponse.json({ ok: true });
}
