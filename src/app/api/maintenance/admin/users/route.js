import { NextResponse } from 'next/server';
import { getAdminClient } from '@/lib/supabase/admin';
import { isOwner } from '@/lib/maintenance/owner-auth';

/**
 * GET  /api/maintenance/admin/users   — list all admin profiles
 * POST /api/maintenance/admin/users   — create a new admin user
 *
 * Both are owner-gated.
 *
 * POST body: { email, password, fullName? }
 * Behavior:
 *   1. Calls supabase.auth.admin.createUser({ email, password, email_confirm: true })
 *      — `email_confirm: true` skips the email-verification step, since we
 *      trust the owner who's creating the account.
 *   2. The on_auth_user_created trigger inserts a profile row.
 *   3. We update the profile with tier='admin' and the optional full_name.
 *
 * If email is already in use, supabase.auth.admin.createUser returns an
 * error which we surface to the caller (409).
 */

export async function GET() {
  const auth = await isOwner();
  if (!auth.authed) return NextResponse.json({ error: 'not found' }, { status: 404 });

  const supabase = getAdminClient();
  if (!supabase) return NextResponse.json({ error: 'storage not configured' }, { status: 503 });

  const { data, error } = await supabase
    .from('profiles')
    .select('id,email,full_name,tier,created_at')
    .eq('tier', 'admin')
    .order('created_at', { ascending: false });
  if (error) {
    // eslint-disable-next-line no-console
    console.error('[users] list failed:', error);
    return NextResponse.json({ error: 'query failed' }, { status: 500 });
  }
  return NextResponse.json({
    users: data || [],
    currentUserId: auth.user?.id || null,
  });
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
  const { email, password, fullName } = body || {};

  if (!email || typeof email !== 'string' || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
    return NextResponse.json({ error: 'Valid email is required.' }, { status: 400 });
  }
  if (!password || typeof password !== 'string' || password.length < 8) {
    return NextResponse.json({ error: 'Password must be at least 8 characters.' }, { status: 400 });
  }
  const cleanEmail = email.trim().toLowerCase();
  const cleanName = fullName ? String(fullName).trim().slice(0, 200) : null;

  const supabase = getAdminClient();
  if (!supabase) return NextResponse.json({ error: 'storage not configured' }, { status: 503 });

  // Step 1: create the auth user (with email pre-confirmed since the owner is creating it).
  const { data: createData, error: createErr } = await supabase.auth.admin.createUser({
    email: cleanEmail,
    password,
    email_confirm: true,
    user_metadata: cleanName ? { full_name: cleanName } : undefined,
  });
  if (createErr || !createData?.user) {
    const msg = String(createErr?.message || 'Could not create user.');
    const status = msg.toLowerCase().includes('already') ? 409 : 500;
    return NextResponse.json({ error: msg }, { status });
  }

  // Step 2: the trigger has now inserted a profile row. Promote it to admin.
  const { data: updated, error: updateErr } = await supabase
    .from('profiles')
    .update({ tier: 'admin', full_name: cleanName })
    .eq('id', createData.user.id)
    .select('id,email,full_name,tier,created_at')
    .single();

  if (updateErr) {
    // Rollback the auth user so we don't leave orphans.
    await supabase.auth.admin.deleteUser(createData.user.id);
    return NextResponse.json({ error: 'Could not assign admin tier.', detail: updateErr.message }, { status: 500 });
  }

  return NextResponse.json({ user: updated }, { status: 201 });
}
