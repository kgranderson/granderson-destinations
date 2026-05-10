import Link from 'next/link';
import { NavBar } from '@/components/shared/NavBar';
import { Footer } from '@/components/shared/Footer';
import { Container } from '@/components/shared/Container';

export const metadata = {
  title: 'Sign in',
  description: 'Sign in to your Granderson Destinations account.',
};

export default function LoginPage() {
  return (
    <>
      <NavBar />
      <main className="animate-page-in pt-32">
        <Container size="sm" className="pb-20">
          <p className="text-xs uppercase tracking-[0.32em] text-brand-slate/70">Members</p>
          <h1 className="display mt-3 text-display-lg text-brand-ink">Sign in</h1>
          <p className="mt-3 text-brand-slate">
            Authentication ships in Milestone 2 — Supabase OAuth + magic-link. Until then, you can browse
            the full site without an account.
          </p>
          <div className="mt-8 rounded-2xl border border-brand-tan/60 bg-brand-sand/40 p-6">
            <p className="text-sm text-brand-slate">
              While we finish wiring auth, jump straight to the things you came here for:
            </p>
            <div className="mt-4 flex flex-wrap gap-3">
              <Link href="/destinations" className="rounded-full bg-brand-ink px-5 py-2 text-sm text-brand-cloud">
                Browse properties
              </Link>
              <Link href="/events" className="rounded-full border border-brand-ink px-5 py-2 text-sm">
                Events calendar
              </Link>
              <Link href="/contact" className="rounded-full border border-brand-ink px-5 py-2 text-sm">
                Talk to a concierge
              </Link>
            </div>
          </div>
        </Container>
      </main>
      <Footer />
    </>
  );
}
