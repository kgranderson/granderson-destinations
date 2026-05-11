import { Reveal } from '../shared/Reveal';

/**
 * The six pillars of the operating system, presented as an editorial
 * ledger. Each cell carries:
 *   - a one-stroke glyph in the brand's arch vocabulary
 *   - a category kicker (small caps champagne) over the title
 *   - a Cormorant italic ghost numeral as a watermark
 *   - a drawing-in champagne keyline beneath the title
 *
 * The cells share content shape but their glyphs differ — the visual
 * variety is what saves the section from feeling like six identical
 * boxes of body copy.
 */

const GLYPHS = {
  horizon: (
    <svg viewBox="0 0 64 32" aria-hidden focusable="false">
      <line x1="2" y1="22" x2="62" y2="22" stroke="currentColor" strokeWidth="1.6" />
      <polyline
        points="22,22 28,16 34,20 40,12 46,22"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  ),
  compass: (
    <svg viewBox="0 0 64 32" aria-hidden focusable="false">
      <path d="M 8 26 A 24 24 0 0 1 56 26" fill="none" stroke="currentColor" strokeWidth="1.6" />
      <line x1="32" y1="26" x2="32" y2="6" stroke="currentColor" strokeWidth="1.6" />
      <polygon points="32,4 29,10 35,10" fill="currentColor" />
    </svg>
  ),
  bars: (
    <svg viewBox="0 0 64 32" aria-hidden focusable="false">
      <line x1="2"  y1="28" x2="62" y2="28" stroke="currentColor" strokeWidth="1.2" />
      <line x1="14" y1="28" x2="14" y2="20" stroke="currentColor" strokeWidth="2.2" />
      <line x1="32" y1="28" x2="32" y2="12" stroke="currentColor" strokeWidth="2.2" />
      <line x1="50" y1="28" x2="50" y2="4"  stroke="currentColor" strokeWidth="2.2" />
    </svg>
  ),
  wave: (
    <svg viewBox="0 0 64 32" aria-hidden focusable="false">
      <path
        d="M 2 18 Q 12 4, 22 18 T 42 18 T 62 18"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
    </svg>
  ),
  sun: (
    <svg viewBox="0 0 64 32" aria-hidden focusable="false">
      <line x1="2" y1="24" x2="62" y2="24" stroke="currentColor" strokeWidth="1.6" />
      <circle cx="32" cy="18" r="6" fill="currentColor" />
      <line x1="32" y1="2"  x2="32" y2="6"  stroke="currentColor" strokeWidth="1.4" />
      <line x1="16" y1="8"  x2="19" y2="11" stroke="currentColor" strokeWidth="1.4" />
      <line x1="48" y1="8"  x2="45" y2="11" stroke="currentColor" strokeWidth="1.4" />
    </svg>
  ),
  arch: (
    <svg viewBox="0 0 64 32" aria-hidden focusable="false">
      <path d="M 18 28 L 18 18 A 14 14 0 0 1 46 18 L 46 28" fill="none" stroke="currentColor" strokeWidth="1.8" />
      <line x1="2"  y1="28" x2="16" y2="28" stroke="currentColor" strokeWidth="1.4" />
      <line x1="48" y1="28" x2="62" y2="28" stroke="currentColor" strokeWidth="1.4" />
      <polygon points="32,11 34,13 32,15 30,13" fill="currentColor" />
    </svg>
  ),
};

const FEATURES = [
  {
    num: 'i',
    kicker: 'Distribution',
    glyph: 'horizon',
    title: 'Market intel feed',
    body: 'A continuously refreshed read on city-council agendas and entitlement filings, so you know what is coming before the comp set does.',
  },
  {
    num: 'ii',
    kicker: 'Discovery',
    glyph: 'compass',
    title: 'Local hotspots, curated',
    body: 'The tables, bars, hikes, galleries and spas within reach of every home. Vetted and updated each season.',
  },
  {
    num: 'iii',
    kicker: 'Pricing',
    glyph: 'bars',
    title: 'Event-driven premiums',
    body: 'Coachella, Stagecoach, Indian Wells, Modernism Week, Cervantino. Pricing and minimum-stay rules tuned around every anchor event.',
  },
  {
    num: 'iv',
    kicker: 'Brand',
    glyph: 'wave',
    title: 'Always-on social',
    body: 'A weekly editorial cadence on Instagram. Geo-tagged for local search, captioned to convert search browsers into bookers.',
  },
  {
    num: 'v',
    kicker: 'Performance',
    glyph: 'sun',
    title: 'Institutional economics',
    body: 'Live P&L benchmarked against AirDNA comps. Expense outliers flagged, revenue levers modeled, top-quartile or on the list.',
  },
  {
    num: 'vi',
    kicker: 'Service',
    glyph: 'arch',
    title: 'Concierge hospitality',
    body: 'AI itineraries, WhatsApp concierge, member-only rates and forty-eight-hour early access to new properties.',
  },
];

export function FeatureGrid() {
  return (
    <section className="section container" id="why">
      <Reveal>
        <div className="section-header">
          <div className="eyebrow">
            <span className="diamond" aria-hidden /> &nbsp; Why Granderson
          </div>
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
              <span className="feature-ghost" aria-hidden>{f.num}</span>
              <div className="feature-glyph" aria-hidden>{GLYPHS[f.glyph]}</div>
              <div className="feature-kicker">{f.kicker}</div>
              <h3>{f.title}</h3>
              <p>{f.body}</p>
            </article>
          ))}
        </div>
      </Reveal>
    </section>
  );
}
