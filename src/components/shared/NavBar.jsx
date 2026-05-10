'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { Menu, X } from 'lucide-react';
import { cn } from '@/lib/utils/cn';
import { BRAND } from '@/lib/constants';

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

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <header
      className={cn(
        'fixed inset-x-0 top-0 z-50 transition-all duration-500 ease-out-quint',
        scrolled
          ? 'bg-brand-cloud/85 backdrop-blur supports-[backdrop-filter]:bg-brand-cloud/70 border-b border-brand-tan/60'
          : 'bg-transparent',
      )}
    >
      <div className="mx-auto flex max-w-[88rem] items-center justify-between px-5 py-4 sm:px-8 lg:px-10">
        <Link href="/" className="flex items-center gap-3">
          <span className="display text-lg leading-none text-brand-ink">{BRAND.name}</span>
        </Link>

        <nav className="hidden items-center gap-7 md:flex">
          {LINKS.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className="text-sm tracking-wide text-brand-ink/80 transition-colors hover:text-brand-ink"
            >
              {l.label}
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
          className="md:hidden"
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
