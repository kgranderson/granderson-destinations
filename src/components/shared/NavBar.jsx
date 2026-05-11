'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { Menu, X, ShieldCheck, LogIn } from 'lucide-react';
import { cn } from '@/lib/utils/cn';
import { BRAND } from '@/lib/constants';
import { getBrowserClient } from '@/lib/supabase/client';

const LINKS = [
  { href: '/destinations', label: 'Destinations' },
  { href: '/experiences/palm-springs', label: 'Experiences' },
  { href: '/events', label: 'Events' },
  { href: '/about', label: 'About' },
  { href: '/contact', label: 'Contact' },
];

export function NavBar() {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [authState, setAuthState] = useState({ loading: true, signedIn: false, isAdmin: false });

  // Scroll-state for the bar background
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Auth state — drives the right-most pill (Sign in / Admin / Account)
  useEffect(() => {
    const supabase = getBrowserClient();
    if (!supabase) {
      setAuthState({ loading: false, signedIn: false, isAdmin: false });
      return;
    }
    let alive = true;

    async function refresh() {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!alive) return;
      if (!user) {
        setAuthState({ loading: false, signedIn: false, isAdmin: false });
        return;
      }
      const { data: profile } = await supabase
        .from('profiles')
        .select('tier')
        .eq('id', user.id)
        .maybeSingle();
      if (!alive) return;
      setAuthState({
        loading: false,
        signedIn: true,
        isAdmin: profile?.tier === 'admin',
      });
    }

    refresh();
    const { data: sub } = supabase.auth.onAuthStateChange(() => refresh());
    return () => {
      alive = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  return (
    <header
      className={cn(
        'fixed inset-x-0 top-0 z-50 transition-all duration-500 ease-out-quint',
        scrolled
          ? 'border-b border-brand-tan/60 bg-brand-cloud/95 backdrop-blur supports-[backdrop-filter]:bg-brand-cloud/85'
          : 'bg-gradient-to-b from-brand-ink/45 via-brand-ink/20 to-transparent',
      )}
    >
      <div className="mx-auto flex max-w-[88rem] items-center justify-between px-5 py-4 sm:px-8 lg:px-10">
        <Link href="/" className="flex items-center gap-3">
          <span
            className={cn(
              'display text-lg leading-none transition-colors',
              scrolled ? 'text-brand-ink' : 'text-brand-cloud',
            )}
          >
            {BRAND.name}
          </span>
        </Link>

        <nav className="hidden items-center gap-7 md:flex">
          {LINKS.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className={cn(
                'text-sm font-medium tracking-wide transition-colors',
                scrolled
                  ? 'text-brand-ink/85 hover:text-brand-ink'
                  : 'text-brand-cloud/95 hover:text-brand-cloud',
              )}
            >
              {l.label}
            </Link>
          ))}

          {/* Auth-aware pill: Admin / Account / Sign in */}
          {!authState.loading &&
            (authState.isAdmin ? (
              <Link
                href="/admin"
                className={cn(
                  'inline-flex items-center gap-1 rounded-full px-3 py-1.5 text-xs font-medium tracking-wide transition-colors',
                  scrolled
                    ? 'bg-brand-gold/25 text-brand-ink hover:bg-brand-gold/40'
                    : 'bg-brand-cloud/20 text-brand-cloud hover:bg-brand-cloud/30',
                )}
              >
                <ShieldCheck size={12} /> Admin
              </Link>
            ) : authState.signedIn ? (
              <Link
                href="/economics"
                className={cn(
                  'text-sm font-medium transition-colors',
                  scrolled
                    ? 'text-brand-ink/85 hover:text-brand-ink'
                    : 'text-brand-cloud/95 hover:text-brand-cloud',
                )}
              >
                Account
              </Link>
            ) : (
              <Link
                href="/auth/login"
                className={cn(
                  'inline-flex items-center gap-1 text-sm font-medium tracking-wide transition-colors',
                  scrolled
                    ? 'text-brand-ink/85 hover:text-brand-ink'
                    : 'text-brand-cloud/95 hover:text-brand-cloud',
                )}
              >
                <LogIn size={12} /> Sign in
              </Link>
            ))}

          <Link
            href="/destinations"
            className="rounded-full bg-brand-ink px-5 py-2 text-sm font-medium text-brand-cloud transition-colors hover:bg-brand-slate"
          >
            Book a stay
          </Link>
        </nav>

        <button
          aria-label="Toggle navigation"
          aria-expanded={open}
          aria-controls="mobile-nav"
          className={cn(
            'transition-colors md:hidden',
            scrolled ? 'text-brand-ink' : 'text-brand-cloud',
          )}
          onClick={() => setOpen((o) => !o)}
        >
          {open ? <X /> : <Menu />}
        </button>
      </div>

      {open && (
        <div id="mobile-nav" className="border-t border-brand-tan/60 bg-brand-cloud md:hidden">
          <div className="flex flex-col gap-1 px-6 py-4">
            {LINKS.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                onClick={() => setOpen(false)}
                className="py-2 text-base text-brand-ink/90"
              >
                {l.label}
              </Link>
            ))}

            {!authState.loading && (
              <Link
                href={
                  authState.isAdmin ? '/admin' : authState.signedIn ? '/economics' : '/auth/login'
                }
                onClick={() => setOpen(false)}
                className="flex items-center gap-2 py-2 text-base font-medium text-brand-ink"
              >
                {authState.isAdmin ? (
                  <>
                    <ShieldCheck size={14} /> Admin dashboard
                  </>
                ) : authState.signedIn ? (
                  'Account'
                ) : (
                  <>
                    <LogIn size={14} /> Sign in
                  </>
                )}
              </Link>
            )}

            <Link
              href="/destinations"
              onClick={() => setOpen(false)}
              className="mt-2 inline-flex items-center justify-center rounded-full bg-brand-ink px-5 py-3 font-medium text-brand-cloud"
            >
              Book a stay
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
