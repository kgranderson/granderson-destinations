import { Container } from '../shared/Container';
import { Counter } from '../shared/Counter';
import { Reveal } from '../shared/Reveal';

const STATS = [
  { label: 'Top-quartile ADR vs. comp set', value: 92, suffix: '%' },
  { label: 'Repeat-guest rate', value: 38, suffix: '%' },
  { label: 'Five-star reviews', value: 96, suffix: '%' },
  { label: 'Markets live today', value: 2, suffix: '' },
];

export function Stats() {
  return (
    <section className="bg-brand-ink py-20 text-brand-cloud">
      <Container>
        <Reveal>
          <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
            {STATS.map((s) => (
              <div key={s.label}>
                <p className="display text-display-md text-brand-cloud">
                  <Counter to={s.value} format={(n) => `${Math.round(n)}${s.suffix}`} />
                </p>
                <p className="mt-3 text-sm leading-snug text-brand-cloud/70">{s.label}</p>
              </div>
            ))}
          </div>
        </Reveal>
      </Container>
    </section>
  );
}
