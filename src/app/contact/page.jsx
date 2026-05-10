import { NavBar } from '@/components/shared/NavBar';
import { Footer } from '@/components/shared/Footer';
import { Container } from '@/components/shared/Container';
import { BRAND } from '@/lib/constants';

export const metadata = { title: 'Contact' };

export default function ContactPage() {
  return (
    <>
      <NavBar />
      <main className="animate-page-in pt-32">
        <Container size="md" className="pb-20">
          <p className="text-xs uppercase tracking-[0.32em] text-brand-slate/70">Contact</p>
          <h1 className="display mt-3 text-display-lg text-brand-ink">
            Talk to a real concierge.
          </h1>
          <p className="mt-4 max-w-2xl text-brand-slate">
            We respond within an hour during business hours, and within 12 hours overnight.
          </p>
          <ul className="mt-8 space-y-2 text-brand-ink">
            <li>Email · <a className="underline" href={`mailto:${BRAND.bookingEmail}`}>{BRAND.bookingEmail}</a></li>
            <li>WhatsApp · {BRAND.whatsapp || 'Coming soon'}</li>
            <li>Instagram · <a className="underline" href={`https://instagram.com/${BRAND.instagram}`}>@{BRAND.instagram}</a></li>
          </ul>
        </Container>
      </main>
      <Footer />
    </>
  );
}
