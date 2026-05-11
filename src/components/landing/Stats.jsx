import { Counter } from '../shared/Counter';
import { Reveal } from '../shared/Reveal';

/**
 * The receipts — a single dark editorial moment in the page rhythm.
 * Four operating numbers presented like a published table-of-receipts:
 *
 *   <champagne tick>
 *   OPERATING        ← small-caps category
 *   87%              ← big display Cormorant
 *   Top-quartile     ← legible label, upright, not italic
 *   ADR vs. AirDNA
 *
 * The previous Stats section had 14px italic muted Cormorant labels,
 * which became invisible eyebrow-feathers floating in the dark. This
 * rebuild gives the labels real weight (Inter 16px, full text color)
 * and gives the whole section a section-header anchor.
 */

const STATS = [
  {
    cat: 'Operating',
    value: 87,
    decimals: 0,
    suffix: '%',
    label: 'Top-quartile ADR vs. the AirDNA comp set.',
  },
  {
    cat: 'Loyalty',
    value: 42,
    decimals: 0,
    suffix: '%',
    label: 'Repeat-guest rate across the portfolio.',
  },
  {
    cat: 'Reputation',
    value: 4.9,
    decimals: 1,
    suffix: '/ 5',
    label: 'Average across the last two hundred reviews.',
  },
  {
    cat: 'Footprint',
    value: 2,
    decimals: 0,
    suffix: '',
    label: 'Markets live, with three opening through 2026.',
  },
];

export function Stats() {
  return (
    <section className="section container" id="receipts">
      <Reveal>
        <div className="section-header">
          <div className="eyebrow">
            <span className="diamond" aria-hidden /> &nbsp; The receipts
          </div>
          <h2>Top-quartile, in the open.</h2>
          <p className="italic-sub">
            Four operating numbers we keep an eye on every week, because investors expect to see
            them and guests can feel them.
          </p>
        </div>
      </Reveal>

      <Reveal stagger>
        <div className="stats">
          {STATS.map((s) => (
            <div key={s.cat} className="stat reveal">
              <div className="stat-tick" aria-hidden />
              <div className="stat-cat">{s.cat}</div>
              <div className="figure">
                <Counter to={s.value} decimals={s.decimals} duration={1600} />
                {s.suffix && <sub>{s.suffix}</sub>}
              </div>
              <div className="stat-label">{s.label}</div>
            </div>
          ))}
        </div>
      </Reveal>
    </section>
  );
}
