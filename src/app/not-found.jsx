import Link from 'next/link';
import { Container } from '@/components/shared/Container';
import { NavBar } from '@/components/shared/NavBar';
import { Footer } from '@/components/shared/Footer';

export default function NotFound() {
  return (
    <>
      <NavBar />
      <main className="min-h-[70vh] bg-brand-cloud pt-40">
        <Container size="md" className="text-center">
          <p className="text-xs uppercase tracking-[0.3em] text-brand-slate/70">404</p>
          <h1 className="display mt-3 text-display-lg text-brand-ink">
            The page you&rsquo;re looking for has checked out.
          </h1>
          <p className="mt-4 text-brand-slate">Try the destinations index or our events calendar.</p>
          <div className="mt-8 flex justify-center gap-4">
            <Link href="/destinations" className="rounded-full bg-brand-ink px-6 py-3 text-sm text-brand-cloud">
              Destinations
            </Link>
            <Link href="/events" className="rounded-full border border-brand-ink px-6 py-3 text-sm text-brand-ink">
              Events
            </Link>
          </div>
        </Container>
      </main>
      <Footer />
    </>
  );
}
