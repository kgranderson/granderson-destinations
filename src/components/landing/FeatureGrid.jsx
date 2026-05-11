import { Reveal } from '../shared/Reveal';

const FEATURES = [
  { num: 'i.',   title: 'Market intel feed',          body: 'A continuously refreshed read on city-council agendas and entitlement filings, so you know what is coming before the comp set does.' },
  { num: 'ii.',  title: 'Local hotspots, curated',    body: 'The tables, bars, hikes, galleries and spas within reach of every home. Vetted and updated each season.' },
  { num: 'iii.', title: 'Event-driven premiums',      body: 'Coachella, Stagecoach, Indian Wells, Modernism Week, Cervantino. Pricing and minimum-stay rules tuned around every anchor event.' },
  { num: 'iv.',  title: 'Always-on social',           body: 'A weekly editorial cadence on Instagram. Geo-tagged for local search, captioned to convert search browsers into bookers.' },
  { num: 'v.',   title: 'Institutional economics',    body: 'Live P&L benchmarked against AirDNA comps. Expense outliers flagged, revenue levers modeled, top-quartile or on the list.' },
  { num: 'vi.',  title: 'Concierge hospitality',      body: 'AI itineraries, WhatsApp concierge, member-only rates and forty-eight-hour early access to new properties.' },
];

export function FeatureGrid() {
  return (
    <section className="section container" id="why">
      <Reveal>
        <div className="section-header">
          <div className="eyebrow">Why Granderson</div>
          <h2>The hospitality is hand-crafted.</h2>
          <p className="italic-sub">
            The operating system is built for top-quartile performance, and the receipts are in the
            dashboard.
          </p>
        </div>
      </Reveal>

      <Reveal stagger>
        <div className="features-grid">
          {FEATURES.map((f) => (
            <article key={f.num} className="feature reveal">
              <div className="num">{f.num}</div>
              <h3>{f.title}</h3>
              <p>{f.body}</p>
            </article>
          ))}
        </div>
      </Reveal>
    </section>
  );
}
