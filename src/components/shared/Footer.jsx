import Link from 'next/link';
import { Container } from './Container';
import { BRAND } from '@/lib/constants';

export function Footer() {
  return (
    <footer className="mt-24 border-t border-brand-tan/60 bg-brand-sand/40">
      <Container className="py-14">
        <div className="grid gap-10 md:grid-cols-4">
          <div>
            <p className="display text-2xl text-brand-ink">{BRAND.name}</p>
            <p className="mt-3 max-w-xs text-sm leading-relaxed text-brand-slate">{BRAND.tagline}</p>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-brand-slate/70">Stay</p>
            <ul className="mt-4 space-y-2 text-sm text-brand-ink/80">
              <li><Link href="/destinations">All properties</Link></li>
              <li><Link href="/destinations/palm-springs">Palm Springs</Link></li>
              <li><Link href="/destinations/san-miguel-de-allende">San Miguel de Allende</Link></li>
            </ul>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-brand-slate/70">Discover</p>
            <ul className="mt-4 space-y-2 text-sm text-brand-ink/80">
              <li><Link href="/experiences/palm-springs">Local experiences</Link></li>
              <li><Link href="/events">Events calendar</Link></li>
              <li><Link href="/intel">Market intel</Link></li>
            </ul>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-brand-slate/70">Contact</p>
            <ul className="mt-4 space-y-2 text-sm text-brand-ink/80">
              <li><a href={`mailto:${BRAND.bookingEmail}`}>{BRAND.bookingEmail}</a></li>
              <li>WhatsApp: {BRAND.whatsapp}</li>
              <li><a href={`https://instagram.com/${BRAND.instagram}`}>@{BRAND.instagram}</a></li>
            </ul>
          </div>
        </div>

        <div className="mt-12 flex flex-col items-start justify-between gap-3 border-t border-brand-tan/60 pt-6 text-xs text-brand-slate/80 sm:flex-row">
          <p>© {new Date().getFullYear()} {BRAND.legalName}. All rights reserved.</p>
          <p>
            <Link href="/legal/privacy" className="hover:text-brand-ink">Privacy</Link>
            <span className="mx-3 text-brand-tan">/</span>
            <Link href="/legal/terms" className="hover:text-brand-ink">Terms</Link>
          </p>
        </div>
      </Container>
    </footer>
  );
}
