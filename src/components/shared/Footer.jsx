import Link from 'next/link';
import { ArchLogo } from './ArchLogo';
import { BRAND } from '@/lib/constants';

export function Footer() {
  return (
    <footer className="footer container">
      <div className="top">
        <div className="brand">
          <div className="logo"><ArchLogo size="lg" showWordmark /></div>
          <p className="tagline">{BRAND.tagline}</p>
        </div>
        <div className="col">
          <h4>Stay</h4>
          <ul>
            <li><Link href="/destinations">All properties</Link></li>
            <li><Link href="/destinations/palm-springs">Palm Springs</Link></li>
            <li><Link href="/destinations/san-miguel-de-allende">San Miguel de Allende</Link></li>
          </ul>
        </div>
        <div className="col">
          <h4>Discover</h4>
          <ul>
            <li><Link href="/experiences">Local experiences</Link></li>
            <li><Link href="/events">Events calendar</Link></li>
            <li><Link href="/intel">Market intel</Link></li>
          </ul>
        </div>
        <div className="col">
          <h4>Contact</h4>
          <ul>
            <li><a href={`mailto:${BRAND.bookingEmail}`}>{BRAND.bookingEmail}</a></li>
            <li><a href={`https://instagram.com/${BRAND.instagram}`}>@{BRAND.instagram}</a></li>
            <li><Link href="/maintenance/report">Report a maintenance issue</Link></li>
          </ul>
        </div>
      </div>
      <div className="bottom">
        <div>© {new Date().getFullYear()} {BRAND.legalName}</div>
        <div style={{ display: 'flex', gap: 'var(--space-6)' }}>
          <Link href="/legal/privacy">Privacy</Link>
          <span className="divider">/</span>
          <Link href="/legal/terms">Terms</Link>
        </div>
      </div>
    </footer>
  );
}
