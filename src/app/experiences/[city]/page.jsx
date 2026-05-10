import { notFound } from 'next/navigation';
import { NavBar } from '@/components/shared/NavBar';
import { Footer } from '@/components/shared/Footer';
import { Container } from '@/components/shared/Container';
import { MARKETS } from '@/lib/constants';

export async function generateStaticParams() {
  return Object.keys(MARKETS).map((city) => ({ city }));
}

export async function generateMetadata({ params }) {
  const m = MARKETS[params.city];
  if (!m) return {};
  return { title: `Experiences · ${m.label}` };
}

export default function ExperiencesPage({ params }) {
  const m = MARKETS[params.city];
  if (!m) notFound();
  return (
    <>
      <NavBar />
      <main className="animate-page-in pt-32">
        <Container className="pb-20">
          <p className="text-xs uppercase tracking-[0.32em] text-brand-slate/70">Experiences</p>
          <h1 className="display mt-3 text-display-lg text-brand-ink">{m.label}</h1>
          <p className="mt-4 max-w-2xl text-brand-slate">
            Curated restaurants, bars, hikes, spas, galleries, and concierge-only experiences land in M3.
          </p>
        </Container>
      </main>
      <Footer />
    </>
  );
}
