import Image from 'next/image';
import Link from 'next/link';
import { Container } from '../shared/Container';
import { Reveal } from '../shared/Reveal';
import { PROPERTIES } from '@/lib/constants';

export function PropertyShowcase() {
  return (
    <section className="bg-brand-cloud py-24 sm:py-32">
      <Container>
        <div className="flex flex-col items-start justify-between gap-6 sm:flex-row sm:items-end">
          <div>
            <p className="text-xs uppercase tracking-[0.32em] text-brand-slate/70">The portfolio</p>
            <h2 className="display mt-3 text-display-lg text-brand-ink">Two homes. Two unmistakable cities.</h2>
          </div>
          <Link
            href="/destinations"
            className="text-sm font-medium text-brand-ink underline-offset-4 hover:underline"
          >
            See all properties →
          </Link>
        </div>

        <div className="mt-12 grid gap-6 stagger-grid md:grid-cols-2">
          {PROPERTIES.map((p, idx) => (
            <Reveal key={p.slug}>
              <Link
                href={`/destinations/${p.slug}`}
                className="group relative block overflow-hidden rounded-2xl bg-brand-ink shadow-soft transition-shadow duration-500 hover:shadow-lift"
                style={{ aspectRatio: '4/5' }}
              >
                {p.coverImage && (
                  <Image
                    src={p.coverImage}
                    alt={`${p.name} — ${p.city}`}
                    fill
                    sizes="(min-width: 768px) 50vw, 100vw"
                    priority={idx === 0}
                    className="object-cover transition-transform duration-[1200ms] ease-out-quint group-hover:scale-[1.04]"
                  />
                )}
                <div
                  aria-hidden
                  className="absolute inset-0 bg-gradient-to-t from-brand-ink via-brand-ink/30 to-transparent"
                />
                <div className="absolute inset-0 flex flex-col justify-end p-8 text-brand-cloud">
                  <p className="text-xs uppercase tracking-[0.28em] text-brand-cloud/85">
                    {p.city} · {p.country}
                  </p>
                  <h3 className="display mt-2 text-3xl sm:text-4xl">{p.name}</h3>
                  <p className="mt-2 max-w-md text-sm text-brand-cloud/90">{p.tagline}</p>
                </div>
              </Link>
            </Reveal>
          ))}
        </div>
      </Container>
    </section>
  );
}
