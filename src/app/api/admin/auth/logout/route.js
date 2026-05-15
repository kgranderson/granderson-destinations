import { NextResponse } from 'next/server';
import { getServerClient } from '@/lib/supabase/server';

/**
 * POST /api/admin/auth/logout
 *
 * Signs the user out of Supabase Auth (clears session cookies) AND clears
 * the legacy gd_owner cookie if present. After this the user has to sign
 * in again to access the admin pages.
 */
export async function POST() {
  const supabase = getServerClient();
  if (supabase) {
    await supabase.auth.signOut();
  }

  const response = NextResponse.json({ ok: true });
  // Also clear the legacy bootstrap cookie so signing out is comprehensive.
  response.cookies.set('gd_owner', '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 0,
    path: '/',
  });
  return response;
}
