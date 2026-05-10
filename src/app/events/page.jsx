import { NavBar } from '@/components/shared/NavBar';
import { Footer } from '@/components/shared/Footer';
import { Container } from '@/components/shared/Container';
import { ANCHOR_EVENTS_SEED } from '@/lib/constants';
import { dateRange } from '@/lib/utils/format';

export const metadata = {
  title: 'Events calendar',
  description: 'Anchor events that move our markets — Coachella, Stagecoach, Indian Wells, Modernism Week, Festival Cervantino, Día de Muertos, and more.',
};

export default function EventsPage() {
  return (
    <>
      <NavBar />
      <main className="animate-page-in pt-32">
        <Container className="pb-20">
          <p className="text-xs uppercase tracking-[0.32em] text-brand-slate/70">Events that move our markets</p>
          <h1 className="display mt-3 text-display-lg text-brand-ink">Plan around the calendar.</h1>
          <p className="mt-4 max-w-2xl text-brand-slate">
            The full event-premium calculator + image-rich event cards land in M3. This is the seed list.
          </p>

          <div className="mt-12 grid gap-4 stagger-grid md:grid-cols-2">
            {ANCHOR_EVENTS_SEED.map((e) => (
              <article key={e.slug} className="rounded-2xl border border-brand-tan/60 bg-brand-cloud p-6 shadow-soft">
                <p className="text-xs uppercase tracking-[0.24em] text-brand-slate/70">{e.market.replace(/-/g, ' ')}</p>
                <h2 className="mt-2 text-xl font-medium text-brand-ink">{e.name}</h2>
                <p className="text-sm text-brand-slate">{dateRange(e.startDate, e.endDate)}</p>
                <div className="mt-4 grid grid-cols-3 gap-3 text-sm">
                  <Stat label="ADR uplift" value={`${Math.round((e.adrUpliftPct - 1) * 100)}%`} />
                  <Stat label="Occ. uplift" value={`+${Math.round(e.occupancyUpliftPct * 100)}pp`} />
                  <Stat label="Min stay" value={`${e.minStayNights} nights`} />
                </div>
                {e.notes && <p className="mt-4 text-sm leading-relaxed text-brand-slate">{e.notes}</p>}
              </article>
            ))}
          </div>
        </Container>
      </main>
      <Footer />
    </>
  );
}

function Stat({ label, value }) {
  return (
    <div className="rounded-xl bg-brand-sand/40 px-3 py-2">
      <p className="text-[10px] uppercase tracking-[0.2em] text-brand-slate/70">{label}</p>
      <p className="mt-0.5 font-medium text-brand-ink">{value}</p>
    </div>
  );
}
