'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { ArchLogo } from './ArchLogo';
import { getBrowserClient } from '@/lib/supabase/client';

const LINKS = [
  { href: '/destinations', label: 'Destinations' },
  // /experiences is the property picker; clicking a tile lands on /experiences/<slug>.
  { href: '/experiences', label: 'Experiences' },
  { href: '/events', label: 'Events' },
  { href: '/about', label: 'About' },
];

export function NavBar() {
  const [authState, setAuthState] = useState({ signedIn: false, isAdmin: false });

  useEffect(() => {
    const supabase = getBrowserClient();
    if (!supabase) return;
    let alive = true;

    async function refresh() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!alive) return;
      if (!user) { setAuthState({ signedIn: false, isAdmin: false }); return; }
      const { data: profile } = await supabase
        .from('profiles').select('tier').eq('id', user.id).maybeSingle();
      if (!alive) return;
      setAuthState({ signedIn: true, isAdmin: profile?.tier === 'admin' });
    }
    refresh();
    const { data: sub } = supabase.auth.onAuthStateChange(() => refresh());
    return () => { alive = false; sub.subscription.unsubscribe(); };
  }, []);

  return (
    <nav className="site-nav">
      <Link href="/" className="logo" aria-label="Granderson Destinations">
        <ArchLogo size="md" />
      </Link>
      <div className="links">
        {LINKS.map((l) => (
          <Link key={l.href} href={l.href} className="hide-mobile">
            {l.label}
          </Link>
        ))}

        {authState.isAdmin ? (
          <Link href="/admin" className="admin-pill">Admin</Link>
        ) : authState.signedIn ? (
          <Link href="/economics" className="hide-mobile">Account</Link>
        ) : (
          <Link href="/auth/login" className="hide-mobile">Sign in</Link>
        )}

        <Link
          href="/destinations"
          className="btn btn-primary"
          style={{ padding: '10px 22px', fontSize: 'var(--text-small)' }}
        >
          Book a stay
        </Link>
      </div>
    </nav>
  );
}
