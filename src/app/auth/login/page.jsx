'use client';

import { useState } from 'react';
import Link from 'next/link';
import { NavBar } from '@/components/shared/NavBar';
import { Footer } from '@/components/shared/Footer';
import { Container } from '@/components/shared/Container';
import { getBrowserClient } from '@/lib/supabase/client';
import { Mail, CheckCircle2, AlertCircle } from 'lucide-react';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState({ kind: 'idle' });

  async function onSubmit(e) {
    e.preventDefault();
    const supabase = getBrowserClient();
    if (!supabase) {
      setStatus({
        kind: 'error',
        message: 'Auth not configured. Set NEXT_PUBLIC_SUPABASE_* envs.',
      });
      return;
    }
    setStatus({ kind: 'pending' });
    const redirectTo = `${window.location.origin}/auth/callback`;
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: redirectTo },
    });
    if (error) {
      setStatus({ kind: 'error', message: error.message });
    } else {
      setStatus({ kind: 'sent' });
    }
  }

  return (
    <>
      <NavBar />
      <main className="animate-page-in pt-32">
        <Container size="sm" className="pb-20">
          <p className="text-xs uppercase tracking-[0.32em] text-brand-slate/70">Sign in</p>
          <h1 className="display mt-3 text-display-lg text-brand-ink">Owner & member access</h1>
          <p className="mt-3 max-w-md text-brand-slate">
            Enter your email — we&rsquo;ll send you a one-time sign-in link. No password required.
          </p>

          {status.kind === 'sent' ? (
            <div className="mt-8 rounded-2xl border border-brand-jade/40 bg-brand-jade/10 p-6 text-brand-ink">
              <CheckCircle2 className="text-brand-jade" size={22} />
              <p className="mt-3 font-medium">Check your inbox.</p>
              <p className="mt-1 text-sm text-brand-slate">
                We sent a sign-in link to <strong>{email}</strong>. Click it within 60 minutes to sign in.
                You can close this tab.
              </p>
            </div>
          ) : (
            <form onSubmit={onSubmit} className="mt-8 max-w-md">
              <label className="block">
                <span className="text-xs uppercase tracking-widest text-brand-slate/70">Email</span>
                <input
                  type="email"
                  required
                  autoFocus
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="mt-2 w-full rounded-md border border-brand-tan/60 bg-brand-cloud p-3 text-base outline-none focus:border-brand-ink"
                  placeholder="you@example.com"
                />
              </label>
              <button
                type="submit"
                disabled={status.kind === 'pending'}
                className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-full bg-brand-ink px-6 py-3 text-sm font-medium text-brand-cloud hover:bg-brand-slate disabled:opacity-50"
              >
                <Mail size={14} />
                {status.kind === 'pending' ? 'Sending…' : 'Send sign-in link'}
              </button>

              {status.kind === 'error' && (
                <div className="mt-4 flex items-start gap-2 rounded-md border border-brand-terracotta/40 bg-brand-terracotta/10 p-3 text-sm text-brand-terracotta">
                  <AlertCircle size={16} className="mt-0.5 shrink-0" />
                  <span>{status.message}</span>
                </div>
              )}
            </form>
          )}

          <p className="mt-10 text-xs text-brand-slate/80">
            Don&rsquo;t have an account?{' '}
            <Link href="/contact" className="underline">
              Reach out to concierge
            </Link>{' '}
            and we&rsquo;ll get you set up.
          </p>
        </Container>
      </main>
      <Footer />
    </>
  );
}
