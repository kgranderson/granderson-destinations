import Image from 'next/image';
import { Container } from '../shared/Container';
import { Reveal } from '../shared/Reveal';

export function PropertyHighlights({ property }) {
  if (!property.highlights?.length) return null;
  return (
    <section className="bg-brand-sand/40 py-20 sm:py-28">
      <Container>
        <Reveal>
          <p className="text-xs uppercase tracking-[0.32em] text-brand-slate/70">What sets it apart</p>
          <h2 className="display mt-3 max-w-3xl text-display-lg text-brand-ink">
            Three reasons people stay longer than they planned.
          </h2>
        </Reveal>

        <div className="mt-12 grid gap-6 stagger-grid md:grid-cols-3">
          {property.highlights.map((h) => (
            <Reveal key={h.title}>
              <article className="overflow-hidden rounded-2xl border border-brand-tan/60 bg-brand-cloud shadow-soft transition-shadow hover:shadow-lift">
                <div className="relative h-56 w-full overflow-hidden">
                  <Image
                    src={h.image}
                    alt={h.title}
                    fill
                    sizes="(min-width: 768px) 33vw, 100vw"
                    className="object-cover transition-transform duration-[1200ms] ease-out-quint hover:scale-[1.05]"
                  />
                </div>
                <div className="p-6">
                  <h3 className="text-lg font-medium text-brand-ink">{h.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-brand-slate">{h.body}</p>
                </div>
              </article>
            </Reveal>
          ))}
        </div>
      </Container>
    </section>
  );
}
