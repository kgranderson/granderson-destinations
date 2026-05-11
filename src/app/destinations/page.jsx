import Image from 'next/image';
import Link from 'next/link';
import { NavBar } from '@/components/shared/NavBar';
import { Footer } from '@/components/shared/Footer';
import { Container } from '@/components/shared/Container';
import { Reveal } from '@/components/shared/Reveal';
import { PROPERTIES } from '@/lib/constants';

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
            {PROPERTIES.map((p, idx) => (
              <Reveal key={p.slug}>
                <Link
                  href={`/destinations/${p.slug}`}
                  className="group relative block overflow-hidden rounded-2xl bg-brand-ink shadow-soft"
                  style={{ aspectRatio: '4/5' }}
                >
                  {p.coverImage && (
                    <Image
                      src={p.coverImage}
                      alt={`${p.name} — ${p.city}`}
                      fill
                      sizes="(min-width: 768px) 50vw, 100vw"
                      priority={idx === 0}
                      className="object-cover transition-transform duration-[1200ms] group-hover:scale-[1.04]"
                    />
                  )}
                  <div
                    aria-hidden
                    className="absolute inset-0 bg-gradient-to-t from-brand-ink via-brand-ink/30 to-transparent"
                  />
                  <div className="absolute inset-0 flex flex-col justify-end p-8 text-brand-cloud">
                    <p className="text-xs uppercase tracking-[0.28em] text-brand-cloud/85">
                      {p.city} · {p.country}
                    </p>
                    <h3 className="display mt-2 text-3xl">{p.name}</h3>
                    <p className="mt-2 max-w-md text-sm text-brand-cloud/90">{p.tagline}</p>
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
