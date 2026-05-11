import { Counter } from '../shared/Counter';
import { Reveal } from '../shared/Reveal';

const STATS = [
  { value: 87, decimals: 0, suffix: '%', label: 'Top-quartile ADR vs. the AirDNA comp set' },
  { value: 42, decimals: 0, suffix: '%', label: 'Repeat-guest rate across the portfolio' },
  { value: 4.9, decimals: 1, suffix: '/ 5', label: 'Average across the last two hundred reviews' },
  { value: 2,  decimals: 0, suffix: '',   label: 'Markets live, three opening in 2026' },
];

export function Stats() {
  return (
    <section className="container" style={{ padding: 'var(--space-12) 0' }}>
      <Reveal stagger>
        <div className="stats">
          {STATS.map((s) => (
            <div key={s.label} className="stat reveal">
              <div className="figure">
                <Counter to={s.value} decimals={s.decimals} duration={1600} />
                {s.suffix && <sub>{s.suffix}</sub>}
              </div>
              <div className="figure-label">{s.label}</div>
            </div>
          ))}
        </div>
      </Reveal>
    </section>
  );
}
