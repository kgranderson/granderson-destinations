import Link from 'next/link';
import { NavBar } from '@/components/shared/NavBar';
import { Footer } from '@/components/shared/Footer';
import { Container } from '@/components/shared/Container';
import { Reveal } from '@/components/shared/Reveal';
import { PROPERTIES, ACCENT_HEX } from '@/lib/constants';

export const metadata = {
  title: 'Destinations',
  description: 'The private portfolio of Granderson Destinations — luxury homes in Palm Springs and San Miguel de Allende.',
};

export default function DestinationsIndex() {
  return (
    <>
      <NavBar />
      <main className="animate-page-in bg-brand-cloud pt-32">
        <Container className="pb-20">
          <p className="text-xs uppercase tracking-[0.32em] text-brand-slate/70">Destinations</p>
          <h1 className="display mt-3 text-display-lg text-brand-ink">The portfolio</h1>
          <p className="mt-4 max-w-2xl text-brand-slate">
            Each home is owned, operated, and held to a single standard: top-quartile performance in its
            market, hand-curated for guests who notice the details.
          </p>

          <div className="mt-14 grid gap-6 stagger-grid md:grid-cols-2">
            {PROPERTIES.map((p) => (
              <Reveal key={p.slug}>
                <Link
                  href={`/destinations/${p.slug}`}
                  className="group relative block overflow-hidden rounded-2xl bg-brand-sand shadow-soft"
                  style={{ aspectRatio: '4/5' }}
                >
                  <div
                    aria-hidden
                    className="absolute inset-0 bg-cover bg-center transition-transform duration-[1200ms] group-hover:scale-[1.04]"
                    style={{
                      backgroundImage: `linear-gradient(180deg, rgba(14,17,22,0) 35%, rgba(14,17,22,0.65) 100%), linear-gradient(135deg, ${ACCENT_HEX[p.accent] || '#C9A24E'}33 0%, #0E1116 100%)`,
                    }}
                  />
                  <div className="absolute inset-0 flex flex-col justify-end p-8 text-brand-cloud">
                    <p className="text-xs uppercase tracking-[0.28em] text-brand-cloud/80">
                      {p.city} · {p.country}
                    </p>
                    <h3 className="display mt-2 text-3xl">{p.name}</h3>
                    <p className="mt-2 max-w-md text-sm text-brand-cloud/85">{p.tagline}</p>
                  </div>
                </Link>
              </Reveal>
            ))}
          </div>
        </Container>
      </main>
      <Footer />
    </>
  );
}
