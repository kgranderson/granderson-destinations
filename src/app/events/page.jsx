import Link from 'next/link';
import Image from 'next/image';
import { NavBar } from '@/components/shared/NavBar';
import { Footer } from '@/components/shared/Footer';
import { Container } from '@/components/shared/Container';
import { ANCHOR_EVENTS_SEED, MARKETS, PROPERTIES } from '@/lib/constants';

export const revalidate = 3600;

export const metadata = {
  title: 'Events',
  description:
    'The events that set the rate ceiling at each Granderson Destinations home — Coachella, Modernism Week, Día de Muertos, Festival Cervantino, and more. Choose your property to see the windows we price around.',
};

/**
 * Top-level /events index — property picker. Mirrors /experiences/page.jsx
 * so each property tile branches to a per-market events list. Replaces the
 * old "all events grouped by market" layout, which made it hard to see at a
 * glance which home benefited from which window.
 */
export default function EventsIndexPage() {
  const todayIso = new Date().toISOString().slice(0, 10);

  const tiles = PROPERTIES.filter((p) => MARKETS[p.slug]).map((property) => {
    const market = MARKETS[property.slug];
    const upcoming = ANCHOR_EVENTS_SEED
      .filter((e) => e.market === property.slug && e.endDate >= todayIso)
      .sort((a, b) => a.startDate.localeCompare(b.startDate));
    return { property, market, upcomingCount: upcoming.length, nextEvent: upcoming[0] || null };
  });

  return (
    <>
      <NavBar />
      <main className="animate-page-in bg-brand-cloud">
        {/* Hero */}
        <section className="bg-brand-ink py-32 text-brand-cloud">
          <Container>
            <p className="text-xs uppercase tracking-[0.32em] text-brand-cloud/70">
              Plan around the calendar
            </p>
            <h1 className="display mt-3 max-w-4xl text-display-xl text-brand-cloud">
              Pick your home, see the events that set its rate ceiling.
            </h1>
            <p className="mt-4 max-w-2xl text-base leading-relaxed text-brand-cloud/85 sm:text-lg">
              Every Granderson Destinations home is priced and operated around the marquee events
              in its market. Coachella, Stagecoach, BNP Paribas Open, Modernism Week, Festival
              Cervantino, Día de Muertos, San Miguel Jazz Festival — each property has its own
              calendar of windows worth booking around. Choose the home below to see what&rsquo;s
              upcoming and the revenue model behind every window.
            </p>
          </Container>
        </section>

        {/* Per-property tiles */}
        <section className="bg-brand-cloud py-16 sm:py-20">
          <Container>
            <div className="grid gap-8 stagger-grid sm:grid-cols-2">
              {tiles.map(({ property, market, upcomingCount, nextEvent }) => (
                <Link
                  key={property.slug}
                  href={`/events/${property.slug}`}
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
                      Events at {property.name}
                    </h2>
                    <p className="mt-3 max-w-md text-sm text-brand-cloud/85 sm:text-base">
                      {market.label === 'Palm Springs'
                        ? 'Coachella, Stagecoach, BNP Paribas Open, Modernism Week — the windows we price around to lift ADR by 25–65%.'
                        : 'Festival Cervantino, Día de Muertos, San Miguel Jazz — high-demand windows with 20–50% ADR uplift and longer minimum stays.'}
                    </p>
                    <div className="mt-5 inline-flex items-center gap-3 rounded-full bg-brand-cloud/10 px-4 py-1.5 backdrop-blur-sm">
                      <span className="text-[10px] uppercase tracking-widest text-brand-cloud/65">Upcoming</span>
                      <span className="text-sm font-medium text-brand-cloud">
                        {upcomingCount} {upcomingCount === 1 ? 'event' : 'events'}
                      </span>
                      {nextEvent && (
                        <>
                          <span className="text-brand-cloud/40">·</span>
                          <span className="text-xs text-brand-cloud/75">next: {nextEvent.name.split('—')[0].trim()}</span>
                        </>
                      )}
                    </div>
                    <p className="mt-6 inline-flex items-center gap-1 text-sm text-brand-cloud/90 underline-offset-4 group-hover:underline">
                      Open the {property.name} event calendar →
                    </p>
                  </div>
                </Link>
              ))}
            </div>

            <p className="mt-12 max-w-2xl text-sm text-brand-slate">
              Every event detail page includes an interactive revenue model: ADR uplift, occupancy
              lift, minimum stay, projected revenue vs. baseline. The same model drives our
              dynamic-pricing layer at PriceLabs.
            </p>
          </Container>
        </section>
      </main>
      <Footer />
    </>
  );
}
