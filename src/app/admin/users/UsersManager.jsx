'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export function UsersManager({ initialUsers, currentUserId }) {
  const router = useRouter();
  const [users, setUsers] = useState(initialUsers);
  const [form, setForm] = useState({ email: '', password: '', fullName: '' });
  const [busy, setBusy] = useState(false);
  const [flash, setFlash] = useState('');
  const [error, setError] = useState('');

  // Per-row UI: track which user has an open "reset password" panel.
  const [resetFor, setResetFor] = useState(null);
  const [resetPwd, setResetPwd] = useState('');

  async function submitForm(e) {
    e.preventDefault();
    setError('');
    setFlash('');
    if (!form.email || !form.password) {
      setError('Email and password are required.');
      return;
    }
    if (form.password.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }
    setBusy(true);
    try {
      const r = await fetch('/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: form.email.trim().toLowerCase(),
          password: form.password,
          fullName: form.fullName.trim() || null,
        }),
      });
      const json = await r.json();
      if (!r.ok) throw new Error(json.error || 'Add failed');
      setUsers((prev) => [json.user, ...prev]);
      setForm({ email: '', password: '', fullName: '' });
      setFlash(`Added ${json.user.email}. They can sign in now.`);
      router.refresh();
    } catch (err) {
      setError(err.message || 'Something went wrong.');
    } finally {
      setBusy(false);
    }
  }

  async function resetPassword(user) {
    if (!resetPwd || resetPwd.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }
    setError('');
    setFlash('');
    try {
      const r = await fetch(`/api/admin/users/${user.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: resetPwd }),
      });
      const json = await r.json();
      if (!r.ok) throw new Error(json.error || 'Reset failed');
      setFlash(`Password reset for ${user.email}. Give them the new password securely.`);
      setResetFor(null);
      setResetPwd('');
    } catch (err) {
      setError(err.message || 'Reset failed');
    }
  }

  async function revokeAccess(user) {
    if (!window.confirm(`Revoke admin access for ${user.email}? They'll lose the dashboard immediately. Their account still exists; you can re-promote them later.`)) return;
    setError('');
    try {
      const r = await fetch(`/api/admin/users/${user.id}`, { method: 'DELETE' });
      const json = await r.json();
      if (!r.ok) throw new Error(json.error || 'Revoke failed');
      setUsers((prev) => prev.filter((u) => u.id !== user.id));
      setFlash(`${user.email} no longer has admin access.`);
      router.refresh();
    } catch (err) {
      setError(err.message || 'Revoke failed');
    }
  }

  return (
    <div className="mt-8 space-y-12">
      {/* Users list */}
      <section>
        <div className="overflow-hidden rounded-xl border border-brand-slate/15 bg-white">
          <div className="grid grid-cols-[1.4fr_1.6fr_1fr_180px] gap-3 px-4 py-2 text-[11px] uppercase tracking-widest text-brand-slate font-medium border-b border-brand-slate/10">
            <div>Name</div>
            <div>Email</div>
            <div>Added</div>
            <div className="text-right">Actions</div>
          </div>
          {users.length === 0 && (
            <div className="px-4 py-10 text-center text-sm text-brand-slate">
              No admin users yet — add one below.
            </div>
          )}
          {users.map((u) => {
            const isSelf = currentUserId && u.id === currentUserId;
            return (
              <div key={u.id} className="border-b border-brand-slate/10 last:border-b-0">
                <div className="grid grid-cols-[1.4fr_1.6fr_1fr_180px] gap-3 px-4 py-3 text-sm items-center">
                  <div>
                    <div className="text-brand-ink font-medium">{u.full_name || '—'}</div>
                    {isSelf && <div className="text-[10px] uppercase tracking-widest text-brand-jade">You</div>}
                  </div>
                  <div className="text-xs text-brand-ink truncate" title={u.email}>{u.email}</div>
                  <div className="text-xs text-brand-slate">
                    {u.created_at ? new Date(u.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—'}
                  </div>
                  <div className="flex justify-end gap-1.5 text-xs">
                    <button
                      onClick={() => setResetFor(resetFor === u.id ? null : u.id)}
                      className="rounded-full border border-brand-ink/30 px-3 py-0.5 text-[10px] text-brand-ink hover:bg-brand-cloud">
                      Reset password
                    </button>
                    <button
                      onClick={() => revokeAccess(u)}
                      disabled={isSelf}
                      className="rounded-full border border-rose-300 px-3 py-0.5 text-[10px] text-rose-700 hover:bg-rose-50 disabled:opacity-30">
                      Revoke
                    </button>
                  </div>
                </div>
                {resetFor === u.id && (
                  <div className="bg-brand-cloud border-t border-brand-slate/10 px-4 py-3 flex flex-wrap items-center gap-2">
                    <input
                      type="text"
                      autoComplete="new-password"
                      placeholder="New password (min 8 chars)"
                      value={resetPwd}
                      onChange={(e) => setResetPwd(e.target.value)}
                      className="flex-1 min-w-[200px] rounded-md border border-brand-slate/20 bg-white px-3 py-1.5 text-sm" />
                    <button
                      onClick={() => resetPassword(u)}
                      className="rounded-full bg-brand-ink px-4 py-1.5 text-xs text-brand-cloud">
                      Set password
                    </button>
                    <button
                      onClick={() => { setResetFor(null); setResetPwd(''); }}
                      className="text-xs text-brand-slate underline">
                      Cancel
                    </button>
                    <p className="basis-full text-[10px] text-brand-slate">
                      The new password takes effect immediately. Share it through a secure channel (Signal, 1Password, etc.) — never plain email.
                    </p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
        <p className="mt-3 text-xs text-brand-slate">
          {users.length} admin user{users.length === 1 ? '' : 's'} · everyone here can sign in at{' '}
          <a className="underline" href="/admin/login">/admin/login</a>
        </p>
      </section>

      {/* Add user */}
      <section className="rounded-xl border border-brand-slate/15 bg-white p-6">
        <h2 className="text-xl font-semibold text-brand-ink">Invite a new admin</h2>
        <p className="mt-1 text-sm text-brand-slate">
          You set their starter password directly. Share it with them through a secure channel —
          they can change it themselves on first login (coming soon) or you can reset it for them
          here at any time.
        </p>

        <form onSubmit={submitForm} className="mt-6 grid gap-4 sm:grid-cols-2">
          <label className="block sm:col-span-2">
            <span className="text-xs uppercase tracking-widest text-brand-ink/70 font-medium">Full name</span>
            <input
              value={form.fullName}
              onChange={(e) => setForm((f) => ({ ...f, fullName: e.target.value }))}
              placeholder="Maria Rodriguez"
              className="mt-1 w-full rounded-md border border-brand-slate/20 bg-white px-3 py-2.5 text-sm" />
          </label>

          <label className="block">
            <span className="text-xs uppercase tracking-widest text-brand-ink/70 font-medium">Email *</span>
            <input
              type="email"
              required
              value={form.email}
              onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
              placeholder="maria@granderson.com"
              autoComplete="off"
              className="mt-1 w-full rounded-md border border-brand-slate/20 bg-white px-3 py-2.5 text-sm" />
          </label>
          <label className="block">
            <span className="text-xs uppercase tracking-widest text-brand-ink/70 font-medium">Starter password *</span>
            <input
              type="text"
              required
              minLength={8}
              value={form.password}
              onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
              placeholder="At least 8 characters"
              autoComplete="off"
              className="mt-1 w-full rounded-md border border-brand-slate/20 bg-white px-3 py-2.5 text-sm" />
            <span className="text-[11px] text-brand-slate">
              Shown in plain text so you can copy it before sharing.
            </span>
          </label>

          <div className="sm:col-span-2 flex items-center gap-3">
            <button
              type="submit"
              disabled={busy}
              className="rounded-full bg-brand-ink px-6 py-2.5 text-sm text-brand-cloud disabled:opacity-50">
              {busy ? 'Creating…' : 'Create admin account'}
            </button>
            <button
              type="button"
              onClick={() => setForm({ email: '', password: '', fullName: '' })}
              className="rounded-full border border-brand-ink/30 px-5 py-2.5 text-sm text-brand-ink">
              Clear
            </button>
            {flash && <span className="text-sm text-brand-jade">{flash}</span>}
            {error && <span className="text-sm text-rose-700">{error}</span>}
          </div>
        </form>
      </section>
    </div>
  );
}
