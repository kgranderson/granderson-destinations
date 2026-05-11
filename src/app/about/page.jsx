import { NavBar } from '@/components/shared/NavBar';
import { Footer } from '@/components/shared/Footer';
import { Container } from '@/components/shared/Container';

export const metadata = { title: 'About' };

export default function AboutPage() {
  return (
    <>
      <NavBar />
      <main className="animate-page-in bg-brand-cloud pt-32">
        <Container size="md" className="pb-20">
          <p className="text-xs uppercase tracking-[0.32em] text-brand-slate/70">About</p>
          <h1 className="display mt-3 text-display-lg text-brand-ink">A private portfolio.</h1>
          <p className="mt-4 max-w-2xl text-brand-slate">
            Granderson Destinations is a hand-curated portfolio of luxury short-term rentals,
            operated to top-quartile institutional standards. The full About page lands in M2.
          </p>
        </Container>
      </main>
      <Footer />
    </>
  );
}
