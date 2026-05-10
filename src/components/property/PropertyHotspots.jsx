import Link from 'next/link';
import { Container } from '../shared/Container';
import { Reveal } from '../shared/Reveal';
import { HotspotCard } from '../hotspots/HotspotCard';
import { listFeaturedHotspots } from '@/lib/hotspots/client';

export async function PropertyHotspots({ property }) {
  const { items } = await listFeaturedHotspots(property.slug, 4);
  if (!items.length) return null;

  return (
    <section className="bg-brand-cloud py-20 sm:py-28">
      <Container>
        <div className="flex flex-wrap items-end justify-between gap-4">
          <Reveal>
            <p className="text-xs uppercase tracking-[0.32em] text-brand-slate/70">Right outside the door</p>
            <h2 className="display mt-3 text-display-lg text-brand-ink">
              The places we&rsquo;d send our own friends.
            </h2>
          </Reveal>
          <Link
            href={`/experiences/${property.slug}`}
            className="text-sm font-medium text-brand-ink underline-offset-4 hover:underline"
          >
            All experiences in {property.shortName} →
          </Link>
        </div>

        <div className="mt-12 grid gap-6 stagger-grid sm:grid-cols-2 lg:grid-cols-4">
          {items.map((h) => (
            <Reveal key={h.id}>
              <HotspotCard hotspot={h} />
            </Reveal>
          ))}
        </div>
      </Container>
    </section>
  );
}
