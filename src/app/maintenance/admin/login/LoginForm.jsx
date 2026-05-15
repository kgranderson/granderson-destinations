'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export function LoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  async function submit(e) {
    e.preventDefault();
    setError('');
    if (!email || !password) {
      setError('Email and password are required.');
      return;
    }
    setBusy(true);
    try {
      const r = await fetch('/api/maintenance/admin/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim().toLowerCase(), password }),
      });
      const json = await r.json();
      if (!r.ok) throw new Error(json.error || 'Sign-in failed');
      // Full reload so the server-rendered admin page sees the session cookie.
      window.location.href = '/maintenance/admin';
    } catch (err) {
      setError(err.message || 'Sign-in failed. Check your email and password.');
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} className="grid gap-5">
      <label className="block">
        <span className="text-xs uppercase tracking-widest text-brand-ink/80 font-medium">Email</span>
        <input
          type="email"
          autoComplete="username"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@granderson.com"
          className="mt-1 w-full rounded-md border border-brand-slate/20 bg-white px-3 py-2.5 text-sm" />
      </label>
      <label className="block">
        <span className="text-xs uppercase tracking-widest text-brand-ink/80 font-medium">Password</span>
        <input
          type="password"
          autoComplete="current-password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="At least 8 characters"
          className="mt-1 w-full rounded-md border border-brand-slate/20 bg-white px-3 py-2.5 text-sm" />
      </label>

      {error && <div className="rounded-md bg-rose-50 px-4 py-3 text-sm text-rose-800">{error}</div>}

      <button
        type="submit"
        disabled={busy}
        className="justify-self-start rounded-full bg-brand-ink px-6 py-3 text-sm text-brand-cloud disabled:opacity-50">
        {busy ? 'Signing in…' : 'Sign in'}
      </button>

      <p className="text-xs text-brand-slate">
        Forgot your password or need an account? Contact the property owner — admin accounts are
        created by invitation only.
      </p>
    </form>
  );
}
