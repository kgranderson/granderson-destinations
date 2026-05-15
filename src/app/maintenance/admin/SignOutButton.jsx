'use client';

import { useState } from 'react';

/**
 * Small "Sign out" button shown in the admin dashboard header. POSTs to the
 * logout endpoint which clears both the Supabase session cookies and the
 * legacy gd_owner cookie, then full-reloads to the login page.
 */
export function SignOutButton() {
  const [busy, setBusy] = useState(false);

  async function signOut() {
    setBusy(true);
    try {
      await fetch('/api/maintenance/admin/auth/logout', { method: 'POST' });
    } catch {
      /* swallow — we redirect either way */
    } finally {
      window.location.href = '/maintenance/admin/login';
    }
  }

  return (
    <button
      onClick={signOut}
      disabled={busy}
      className="rounded-full border border-rose-300 px-4 py-1.5 text-xs text-rose-700 hover:bg-rose-50 disabled:opacity-40">
      {busy ? 'Signing out…' : 'Sign out'}
    </button>
  );
}
