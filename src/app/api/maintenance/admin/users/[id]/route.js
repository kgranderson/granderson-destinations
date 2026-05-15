import { NextResponse } from 'next/server';
import { getAdminClient } from '@/lib/supabase/admin';
import { isOwner } from '@/lib/maintenance/owner-auth';

/**
 * DELETE /api/maintenance/admin/users/[id]
 *   Removes admin access. Two modes:
 *     - default (?hard=0): soft-revoke — set tier='guest'. User can no
 *       longer reach admin pages but their auth.users row stays so any
 *       historical references (notes, ticket attributions) still resolve.
 *     - ?hard=1: full delete — removes the auth.users row, which cascades
 *       to delete the profile via FK on delete cascade.
 *
 * PATCH /api/maintenance/admin/users/[id]
 *   Update fullName / password. Body: { fullName?, password? }.
 *
 * Both are owner-gated. We block self-deletion to prevent locking yourself
 * out of the system.
 */

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

  const supabase = getAdminClient();
  if (!supabase) return NextResponse.json({ error: 'storage not configured' }, { status: 503 });

  // Profile fields
  if (typeof body.fullName === 'string' || body.fullName === null) {
    const cleanName = body.fullName ? String(body.fullName).trim().slice(0, 200) : null;
    const { error: profErr } = await supabase
      .from('profiles')
      .update({ full_name: cleanName })
      .eq('id', p.id);
    if (profErr) return NextResponse.json({ error: 'Could not update profile.' }, { status: 500 });
  }

  // Password reset (owner-only — typically used when staff forgets theirs)
  if (typeof body.password === 'string') {
    if (body.password.length < 8) {
      return NextResponse.json({ error: 'Password must be at least 8 characters.' }, { status: 400 });
    }
    const { error: pwErr } = await supabase.auth.admin.updateUserById(p.id, { password: body.password });
    if (pwErr) return NextResponse.json({ error: 'Could not update password.' }, { status: 500 });
  }

  const { data: profile } = await supabase
    .from('profiles').select('id,email,full_name,tier,created_at').eq('id', p.id).single();

  return NextResponse.json({ user: profile });
}

export async function DELETE(request, { params }) {
  const auth = await isOwner();
  if (!auth.authed) return NextResponse.json({ error: 'not found' }, { status: 404 });

  const p = params instanceof Promise ? await params : params;
  if (!p?.id) return NextResponse.json({ error: 'missing id' }, { status: 400 });

  const supabase = getAdminClient();
  if (!supabase) return NextResponse.json({ error: 'storage not configured' }, { status: 503 });

  // Self-deletion guard so a signed-in admin can't lock themselves out.
  if (auth.user?.id && auth.user.id === p.id) {
    return NextResponse.json(
      { error: "You can't remove your own admin access. Sign in as another admin first, then remove yourself if needed." },
      { status: 400 },
    );
  }

  // Last-admin guard. Legacy-cookie callers have no user.id, so the self check
  // above doesn't fire — but they could still delete the final email/password
  // admin and leave the system reachable only via the shared legacy token.
  // Even for session callers, this is a useful belt-and-suspenders defense.
  // We count admins BEFORE deletion; if the target is currently an admin and
  // is the only one left, refuse.
  const { data: targetProfile, error: targetErr } = await supabase
    .from('profiles')
    .select('id,tier')
    .eq('id', p.id)
    .single();
  if (targetErr || !targetProfile) {
    return NextResponse.json({ error: 'user not found' }, { status: 404 });
  }
  if (targetProfile.tier === 'admin') {
    const { count: adminCount, error: countErr } = await supabase
      .from('profiles')
      .select('id', { count: 'exact', head: true })
      .eq('tier', 'admin');
    if (countErr) {
      return NextResponse.json({ error: 'could not verify admin count' }, { status: 500 });
    }
    if ((adminCount ?? 0) <= 1) {
      return NextResponse.json(
        {
          error:
            "This is the only remaining email/password admin. Create a second admin first, then revoke this one — otherwise the dashboard would only be reachable via the legacy token.",
        },
        { status: 400 },
      );
    }
  }

  const hard = new URL(request.url).searchParams.get('hard') === '1';

  if (hard) {
    const { error } = await supabase.auth.admin.deleteUser(p.id);
    if (error) return NextResponse.json({ error: 'delete failed', detail: error.message }, { status: 500 });
  } else {
    const { error } = await supabase
      .from('profiles')
      .update({ tier: 'guest' })
      .eq('id', p.id);
    if (error) return NextResponse.json({ error: 'revoke failed' }, { status: 500 });
  }

  return NextResponse.json({ ok: true, soft: !hard });
}
