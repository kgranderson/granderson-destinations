import { Container } from '../shared/Container';
import { Reveal } from '../shared/Reveal';
import { Check } from 'lucide-react';

export function PropertyAmenities({ property }) {
  const groups = property.amenities ?? {};
  const groupNames = Object.keys(groups);
  if (!groupNames.length) return null;

  return (
    <section className="bg-brand-sand/40 py-20 sm:py-28">
      <Container>
        <Reveal>
          <p className="text-xs uppercase tracking-[0.32em] text-brand-slate/70">Amenities</p>
          <h2 className="display mt-3 text-display-lg text-brand-ink">
            Everything you need. Nothing you don&rsquo;t.
          </h2>
        </Reveal>

        <div className="mt-12 grid gap-8 md:grid-cols-2 lg:grid-cols-4">
          {groupNames.map((g) => (
            <Reveal key={g}>
              <div>
                <p className="text-xs font-semibold uppercase tracking-widest text-brand-slate/70">{g}</p>
                <ul className="mt-4 space-y-2.5 text-sm text-brand-ink">
                  {groups[g].map((a) => (
                    <li key={a} className="flex items-start gap-2">
                      <Check size={16} className="mt-0.5 shrink-0 text-brand-gold" strokeWidth={2.25} />
                      <span>{a}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </Reveal>
          ))}
        </div>
      </Container>
    </section>
  );
}
