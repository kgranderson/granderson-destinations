import { NextResponse } from 'next/server';
import { getServerClient } from '@/lib/supabase/server';
import { getAdminClient } from '@/lib/supabase/admin';

/**
 * POST /api/maintenance/admin/auth/login
 * Body: { email, password }
 *
 * Signs the user in via Supabase Auth (email + password). On success the
 * `@supabase/ssr` server client automatically writes the session cookies.
 *
 * We then verify the signed-in user's `profiles.tier` is 'admin' — if not,
 * we immediately sign them out and return 403 so non-admin accounts can't
 * keep a session lying around that lets them stay "halfway in." This makes
 * sign-in atomic: either you're a fully authed admin or you're nothing.
 */
export async function POST(request) {
  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'bad json' }, { status: 400 });
  }
  const { email, password } = body || {};
  if (!email || !password) {
    return NextResponse.json({ error: 'Email and password are required.' }, { status: 400 });
  }

  const supabase = getServerClient();
  if (!supabase) return NextResponse.json({ error: 'auth not configured' }, { status: 503 });

  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error || !data?.user) {
    // Don't leak whether email exists vs. wrong password.
    return NextResponse.json({ error: 'Invalid email or password.' }, { status: 401 });
  }

  // Verify the user actually has admin tier. We read via the service-role
  // client so we don't depend on RLS visibility (which we just set up for
  // admins, but a brand-new account might not yet have the policy applied).
  const adminClient = getAdminClient();
  if (!adminClient) return NextResponse.json({ error: 'storage not configured' }, { status: 503 });

  const { data: profile } = await adminClient
    .from('profiles')
    .select('id,email,tier')
    .eq('id', data.user.id)
    .maybeSingle();

  if (!profile || profile.tier !== 'admin') {
    // Sign them right back out so a non-admin doesn't sit on a session.
    await supabase.auth.signOut();
    return NextResponse.json(
      { error: 'This account does not have admin access. Contact the owner.' },
      { status: 403 },
    );
  }

  return NextResponse.json({ ok: true, user: { id: data.user.id, email: data.user.email } });
}
