import { NavBar } from '@/components/shared/NavBar';
import { Footer } from '@/components/shared/Footer';
import { Container } from '@/components/shared/Container';
import { EventCard } from '@/components/events/EventCard';
import { ANCHOR_EVENTS_SEED, MARKETS } from '@/lib/constants';
import { EVENT_DETAILS } from '@/lib/events/data';

export const revalidate = 3600;

export const metadata = {
  title: 'Events that move our markets',
  description:
    'Coachella, Stagecoach, Indian Wells, Modernism Week, Festival Cervantino, Día de Muertos and more — image-rich event guide with property-level revenue impact.',
};

export default function EventsPage() {
  // Group future events by market
  const todayIso = new Date().toISOString().slice(0, 10);
  const upcoming = ANCHOR_EVENTS_SEED
    .filter((e) => e.endDate >= todayIso)
    .sort((a, b) => a.startDate.localeCompare(b.startDate));

  const byMarket = upcoming.reduce((acc, e) => {
    (acc[e.market] = acc[e.market] || []).push(e);
    return acc;
  }, {});

  return (
    <>
      <NavBar />
      <main className="animate-page-in">
        {/* Hero */}
        <section className="bg-brand-ink py-32 text-brand-cloud">
          <Container>
            <p className="text-xs uppercase tracking-[0.32em] text-brand-cloud/70">Plan around the calendar</p>
            <h1 className="display mt-3 max-w-4xl text-display-xl text-brand-cloud">
              The events that set the rate ceiling.
            </h1>
            <p className="mt-4 max-w-2xl text-base leading-relaxed text-brand-cloud/85 sm:text-lg">
              Coachella, Stagecoach, BNP Paribas Open, Modernism Week, Festival Cervantino, Día de Muertos, San
              Miguel Jazz Festival — every property in our portfolio is priced and operated around these windows.
              Click any event for the playbook + the revenue model.
            </p>
          </Container>
        </section>

        {/* Per-market sections */}
        {Object.entries(byMarket).map(([market, events]) => (
          <section key={market} className="bg-brand-cloud py-16 sm:py-20">
            <Container>
              <p className="text-xs uppercase tracking-[0.32em] text-brand-slate/70">
                {MARKETS[market]?.label ?? market}
              </p>
              <h2 className="display mt-3 text-display-lg text-brand-ink">
                Upcoming in {MARKETS[market]?.label ?? market}
              </h2>

              <div className="mt-10 grid gap-6 stagger-grid sm:grid-cols-2 lg:grid-cols-3">
                {events.map((e) => (
                  <EventCard key={e.slug} event={e} detail={EVENT_DETAILS[e.slug]} />
                ))}
              </div>
            </Container>
          </section>
        ))}

        {!upcoming.length && (
          <section className="bg-brand-cloud py-20">
            <Container size="md" className="text-center">
              <p className="text-brand-slate">No upcoming events scheduled. Check back soon.</p>
            </Container>
          </section>
        )}
      </main>
      <Footer />
    </>
  );
}
