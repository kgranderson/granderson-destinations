import { Container } from '../shared/Container';
import { Reveal } from '../shared/Reveal';
import {
  CalendarHeart,
  Sparkles,
  Map,
  Camera,
  LineChart,
  BadgeCheck,
} from 'lucide-react';

const FEATURES = [
  {
    icon: Sparkles,
    title: 'Market intel feed',
    body: 'Continuously refreshed read on city-council agendas and entitlement filings — so you know what\'s coming before the comp set does.',
  },
  {
    icon: Map,
    title: 'Local hotspots, curated',
    body: 'The best tables, bars, hikes, galleries and spas within reach of every home — vetted and updated each season.',
  },
  {
    icon: CalendarHeart,
    title: 'Event-driven premiums',
    body: 'Coachella, Stagecoach, Indian Wells, Modernism Week, Cervantino — pricing and minimum-stay rules tuned around every anchor event.',
  },
  {
    icon: Camera,
    title: 'Always-on social presence',
    body: 'A weekly editorial cadence on Instagram, geo-tagged for local search, captioned to convert search browsers into bookers.',
  },
  {
    icon: LineChart,
    title: 'Institutional economics',
    body: 'Live P&L benchmarked against AirDNA comps. Expense outliers flagged, revenue levers modeled, top-quartile or it\'s on the list.',
  },
  {
    icon: BadgeCheck,
    title: 'Concierge-grade hospitality',
    body: 'AI itineraries, WhatsApp concierge, member-only rates and 48-hour early access to new properties.',
  },
];

export function FeatureGrid() {
  return (
    <section className="bg-brand-sand/40 py-24 sm:py-32">
      <Container>
        <Reveal>
          <p className="text-xs uppercase tracking-[0.32em] text-brand-slate/70">Why Granderson</p>
          <h2 className="display mt-3 max-w-3xl text-display-lg text-brand-ink">
            The hospitality is hand-crafted. The operating system is built for top-quartile performance.
          </h2>
        </Reveal>

        <div className="mt-14 grid gap-6 stagger-grid sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map(({ icon: Icon, title, body }) => (
            <Reveal key={title}>
              <div className="h-full rounded-2xl border border-brand-tan/60 bg-brand-cloud p-7 shadow-soft transition-shadow hover:shadow-lift">
                <Icon className="text-brand-gold" size={26} strokeWidth={1.5} />
                <h3 className="mt-5 text-lg font-medium text-brand-ink">{title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-brand-slate">{body}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </Container>
    </section>
  );
}
