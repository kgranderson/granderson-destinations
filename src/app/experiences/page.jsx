import Link from 'next/link';
import Image from 'next/image';
import { NavBar } from '@/components/shared/NavBar';
import { Footer } from '@/components/shared/Footer';
import { Container } from '@/components/shared/Container';
import { PROPERTIES, MARKETS } from '@/lib/constants';

export const metadata = {
  title: 'Experiences',
  description:
    'Curated restaurants, bars, hikes, galleries, and concierge experiences in Palm Springs and San Miguel de Allende — paired to the home you’re staying in.',
};

/**
 * Top-level /experiences index. Branches by property so a guest reaches the
 * right curated picks for the home they’re staying at. Replaces the old
 * navbar shortcut that hardcoded /experiences/palm-springs (which silently
 * hid the San Miguel guide from San Miguel guests).
 */
export default function ExperiencesIndexPage() {
  // Build (property, market) pairs so each tile knows where it points.
  const properties = PROPERTIES.filter((p) => MARKETS[p.slug])
    .map((p) => ({ property: p, market: MARKETS[p.slug] }));

  return (
    <>
      <NavBar />
      <main className="animate-page-in bg-brand-cloud">
        {/* Hero */}
        <section className="bg-brand-ink py-32 text-brand-cloud">
          <Container>
            <p className="text-xs uppercase tracking-[0.32em] text-brand-cloud/70">
              Curated by the host
            </p>
            <h1 className="display mt-3 max-w-4xl text-display-xl text-brand-cloud">
              Pick your home, see the city through our eyes.
            </h1>
            <p className="mt-4 max-w-2xl text-base leading-relaxed text-brand-cloud/85 sm:text-lg">
              Every Granderson Destinations home comes with a hand-picked guide to its city — the
              restaurants we book for friends, the bars worth the detour, the hikes and galleries
              and quiet patios that don&rsquo;t make the influencer reels. Choose the home below
              and we&rsquo;ll show you that city the way the locals see it.
            </p>
          </Container>
        </section>

        {/* Per-property tiles */}
        <section className="bg-brand-cloud py-16 sm:py-20">
          <Container>
            <div className="grid gap-8 stagger-grid sm:grid-cols-2">
              {properties.map(({ property, market }) => (
                <Link
                  key={property.slug}
                  href={`/experiences/${property.slug}`}
                  className="group relative block overflow-hidden rounded-2xl bg-brand-ink shadow-soft transition-shadow hover:shadow-lift"
                >
                  <div className="relative aspect-[4/5] w-full overflow-hidden">
                    {property.coverImage ? (
                      <Image
                        src={property.coverImage}
                        alt=""
                        fill
                        sizes="(min-width: 640px) 50vw, 100vw"
                        className="object-cover opacity-90 transition-transform duration-[1200ms] ease-out-quint group-hover:scale-[1.06]"
                      />
                    ) : (
                      <div className="h-full w-full bg-[radial-gradient(120%_80%_at_30%_30%,#3F4A56,#0E1116)]" />
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-brand-ink via-brand-ink/40 to-transparent" />
                  </div>

                  <div className="absolute inset-x-0 bottom-0 p-8 text-brand-cloud">
                    <p className="text-[10px] uppercase tracking-[0.32em] text-brand-cloud/75">
                      {property.name} · {market.label}
                    </p>
                    <h2 className="display mt-2 text-3xl text-brand-cloud sm:text-4xl">
                      Experiences in {market.label}
                    </h2>
                    <p className="mt-3 max-w-md text-sm text-brand-cloud/85 sm:text-base">
                      {market.label === 'Palm Springs'
                        ? 'Mid-century icons, date-shake stops, palm-canyon hikes, and the desert tables worth dressing for.'
                        : `Cobblestone tables, Friday-night Mariachi mass, rooftop sunsets, and the markets only your taxi driver will admit to.`}
                    </p>
                    <p className="mt-6 inline-flex items-center gap-1 text-sm text-brand-cloud/90 underline-offset-4 group-hover:underline">
                      Open the {market.label} guide →
                    </p>
                  </div>
                </Link>
              ))}
            </div>

            <p className="mt-12 max-w-2xl text-sm text-brand-slate">
              Once you book, your concierge inherits this guide and adds reservations, schedules,
              and the off-menu requests we use as a host.
            </p>
          </Container>
        </section>
      </main>
      <Footer />
    </>
  );
}
