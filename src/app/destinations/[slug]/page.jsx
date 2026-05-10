import { notFound } from 'next/navigation';
import { NavBar } from '@/components/shared/NavBar';
import { Footer } from '@/components/shared/Footer';
import { Container } from '@/components/shared/Container';
import { PROPERTIES } from '@/lib/constants';

export async function generateStaticParams() {
  return PROPERTIES.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }) {
  const p = PROPERTIES.find((x) => x.slug === params.slug);
  if (!p) return {};
  return {
    title: `${p.name} · ${p.city}`,
    description: p.tagline,
  };
}

export default function PropertyPage({ params }) {
  const p = PROPERTIES.find((x) => x.slug === params.slug);
  if (!p) notFound();

  return (
    <>
      <NavBar />
      <main className="animate-page-in pt-32">
        <Container className="pb-20">
          <p className="text-xs uppercase tracking-[0.32em] text-brand-slate/70">
            {p.city} · {p.country}
          </p>
          <h1 className="display mt-3 text-display-xl text-brand-ink">{p.name}</h1>
          <p className="mt-4 max-w-2xl text-brand-slate">{p.tagline}</p>

          <div className="mt-10 rounded-2xl border border-brand-tan/60 bg-brand-sand/40 p-8">
            <p className="text-sm font-medium text-brand-slate">
              Property page placeholder — the full Palm Springs build (Milestone 2) replaces this with hero,
              gallery, amenities, neighborhood, booking widget, FAQ, and structured data.
            </p>
          </div>
        </Container>
      </main>
      <Footer />
    </>
  );
}
