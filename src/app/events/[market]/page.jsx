import Link from 'next/link';
import Image from 'next/image';
import { notFound } from 'next/navigation';
import { NavBar } from '@/components/shared/NavBar';
import { Footer } from '@/components/shared/Footer';
import { Container } from '@/components/shared/Container';
import { EventCard } from '@/components/events/EventCard';
import { ANCHOR_EVENTS_SEED, MARKETS, PROPERTIES } from '@/lib/constants';
import { EVENT_DETAILS } from '@/lib/events/data';

export const revalidate = 3600;

export async function generateStaticParams() {
  return Object.keys(MARKETS).map((market) => ({ market }));
}

export async function generateMetadata({ params }) {
  const p = params instanceof Promise ? await params : params;
  const property = PROPERTIES.find((x) => x.slug === p.market);
  const market = MARKETS[p.market];
  if (!market) return {};
  const propertyName = property?.name || market.label;
  return {
    title: `Events at ${propertyName}`,
    description: `The marquee events that lift rates at ${propertyName} in ${market.label}. Click any event for the playbook plus an interactive revenue model.`,
  };
}

/**
 * Per-market events page — mirrors the structure of /experiences/[city]/page.jsx.
 * Hero with the property's cover image, then the upcoming-events grid, then a
 * CTA back to the property detail page.
 */
export default async function MarketEventsPage({ params }) {
  const p = params instanceof Promise ? await params : params;
  const market = MARKETS[p.market];
  if (!market) notFound();

  const property = PROPERTIES.find((x) => x.slug === p.market);
  const todayIso = new Date().toISOString().slice(0, 10);
  const upcoming = ANCHOR_EVENTS_SEED
    .filter((e) => e.market === p.market && e.endDate >= todayIso)
    .sort((a, b) => a.startDate.localeCompare(b.startDate));

  return (
    <>
      <NavBar />
      <main className="animate-page-in bg-brand-cloud">
        {/* Hero — same shape as /experiences/[city] */}
        <section className="relative isolate overflow-hidden bg-brand-ink text-brand-cloud">
          {property?.coverImage && (
            <div aria-hidden className="absolute inset-0 -z-10">
              <Image
                src={property.coverImage}
                alt=""
                fill
                priority
                sizes="100vw"
                className="object-cover opacity-50"
              />
              <div className="hero-overlay absolute inset-0" />
            </div>
          )}
          <Container className="relative flex min-h-[55vh] flex-col justify-end pb-14 pt-40">
            <p className="text-xs uppercase tracking-[0.32em] text-brand-cloud/80">
              {property ? property.name : market.label} · Events
            </p>
            <h1 className="display mt-3 max-w-4xl text-display-xl text-brand-cloud">
              The windows that move {property ? property.name : market.label}.
            </h1>
            <p className="mt-4 max-w-2xl text-base leading-relaxed text-brand-cloud/85 sm:text-lg">
              {property ? (
                <>
                  These are the events we price{' '}
                  <Link href={`/destinations/${property.slug}`} className="underline underline-offset-4">
                    {property.name}
                  </Link>
                  {' '}around — ADR uplift, occupancy lift, minimum stays, and the revenue model
                  behind every window. Plan your stay against the calendar to land your best night.
                </>
              ) : (
                <>The marquee events in {market.label} that anchor our dynamic-pricing layer.</>
              )}
            </p>
          </Container>
        </section>

        {/* Upcoming events grid */}
        <section className="bg-brand-cloud py-16 sm:py-20">
          <Container>
            <div className="flex items-end justify-between gap-4">
              <div>
                <p className="text-xs uppercase tracking-[0.32em] text-brand-slate/70">
                  {upcoming.length} upcoming {upcoming.length === 1 ? 'event' : 'events'}
                </p>
                <h2 className="display mt-2 text-display-md text-brand-ink">
                  The calendar at {property ? property.name : market.label}
                </h2>
              </div>
              <Link href="/events" className="hidden text-sm text-brand-ink underline-offset-4 hover:underline sm:block">
                ← Switch property
              </Link>
            </div>

            {upcoming.length === 0 ? (
              <p className="mt-12 text-brand-slate">
                No upcoming events on the calendar right now. Check back next quarter.
              </p>
            ) : (
              <div className="mt-10 grid gap-6 stagger-grid sm:grid-cols-2 lg:grid-cols-3">
                {upcoming.map((e) => (
                  <EventCard key={e.slug} event={e} detail={EVENT_DETAILS[e.slug]} property={property} />
                ))}
              </div>
            )}
          </Container>
        </section>

        {/* CTA back to property detail */}
        {property && (
          <section className="bg-brand-sand/40 py-20">
            <Container size="md">
              <div className="rounded-3xl bg-brand-ink p-10 text-brand-cloud sm:p-14">
                <p className="text-xs uppercase tracking-[0.32em] text-brand-cloud/70">Stay here</p>
                <h2 className="display mt-3 max-w-2xl text-display-md text-brand-cloud">
                  Pick the dates that land on the window you want — {property.name} is steps from
                  every one of these events.
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
