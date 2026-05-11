import { notFound } from 'next/navigation';
import { NavBar } from '@/components/shared/NavBar';
import { Footer } from '@/components/shared/Footer';
import { Container } from '@/components/shared/Container';
import { HotspotsGrid } from '@/components/hotspots/HotspotsGrid';
import { listHotspots } from '@/lib/hotspots/client';
import { MARKETS, PROPERTIES } from '@/lib/constants';
import Link from 'next/link';
import Image from 'next/image';

export const revalidate = 3600;

export async function generateStaticParams() {
  return Object.keys(MARKETS).map((city) => ({ city }));
}

export async function generateMetadata({ params }) {
  const m = MARKETS[params.city];
  if (!m) return {};
  return {
    title: `Experiences · ${m.label}`,
    description: `Curated restaurants, bars, hikes, galleries, and concierge experiences in ${m.label}.`,
  };
}

export default async function ExperiencesPage({ params }) {
  const m = MARKETS[params.city];
  if (!m) notFound();

  const property = PROPERTIES.find((p) => p.slug === params.city);
  const { items, stub } = await listHotspots(params.city);

  return (
    <>
      <NavBar />
      <main className="animate-page-in bg-brand-cloud">
        {/* Hero */}
        <section className="relative isolate overflow-hidden bg-brand-ink text-brand-cloud">
          {property?.coverImage && (
            <div aria-hidden className="absolute inset-0 -z-10">
              <Image src={property.coverImage} alt="" fill priority sizes="100vw" className="object-cover opacity-50" />
              <div className="hero-overlay absolute inset-0" />
            </div>
          )}
          <Container className="relative flex min-h-[55vh] flex-col justify-end pb-14 pt-40">
            <p className="text-xs uppercase tracking-[0.32em] text-brand-cloud/80">{m.label} · Experiences</p>
            <h1 className="display mt-3 max-w-4xl text-display-xl text-brand-cloud">
              The places we&rsquo;d send our own friends.
            </h1>
            <p className="mt-4 max-w-2xl text-base leading-relaxed text-brand-cloud/85 sm:text-lg">
              Hand-picked tables, bars, hikes, galleries, and experiences within reach of {m.label}. Updated each
              season; concierge is always one tap ahead with reservations.
            </p>
          </Container>
        </section>

        {/* Grid */}
        <section className="bg-brand-cloud py-16 sm:py-20">
          <Container>
            <div className="flex items-end justify-between gap-4">
              <div>
                <p className="text-xs uppercase tracking-[0.32em] text-brand-slate/70">{items.length} curated picks</p>
                <h2 className="display mt-2 text-display-md text-brand-ink">Explore by category</h2>
              </div>
              {stub && (
                <span className="rounded-full bg-brand-tan/60 px-3 py-1 text-[10px] uppercase tracking-widest text-brand-slate">
                  Editorial · Google Places live when key is set
                </span>
              )}
            </div>
            <div className="mt-10">
              <HotspotsGrid items={items} />
            </div>
          </Container>
        </section>

        {/* CTA back to property */}
        {property && (
          <section className="bg-brand-sand/40 py-20">
            <Container size="md">
              <div className="rounded-3xl bg-brand-ink p-10 text-brand-cloud sm:p-14">
                <p className="text-xs uppercase tracking-[0.32em] text-brand-cloud/70">Stay nearby</p>
                <h2 className="display mt-3 max-w-2xl text-display-md text-brand-cloud">
                  All of this is a short drive, or in {m.label} a short walk, from {property.name}.
                </h2>
                <Link
                  href={`/destinations/${property.slug}`}
                  className="mt-8 inline-block rounded-full bg-brand-cloud px-7 py-3 text-sm font-medium text-brand-ink hover:bg-brand-tan"
                >
                  See the home →
                </Link>
              </div>
            </Container>
          </section>
        )}
      </main>
      <Footer />
    </>
  );
}
