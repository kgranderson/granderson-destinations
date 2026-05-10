import Image from 'next/image';
import { Container } from '../shared/Container';

export function PropertyHero({ property }) {
  return (
    <section className="relative isolate overflow-hidden bg-brand-ink text-brand-cloud">
      <div aria-hidden className="absolute inset-0 -z-10">
        <Image
          src={property.coverImage}
          alt={`${property.name} — ${property.city}`}
          fill
          priority
          sizes="100vw"
          className="object-cover"
        />
        <div className="hero-overlay absolute inset-0" />
      </div>

      <Container className="relative flex min-h-[88vh] flex-col justify-end pb-16 pt-40">
        <p className="text-xs uppercase tracking-[0.32em] text-brand-cloud/80">
          {property.city} · {property.region} · {property.country}
        </p>
        <h1 className="display mt-4 max-w-4xl text-display-xl text-brand-cloud">
          {property.name}
        </h1>
        <p className="mt-4 max-w-2xl text-base leading-relaxed text-brand-cloud/85 sm:text-lg">
          {property.tagline}
        </p>

        <dl className="mt-10 grid max-w-2xl grid-cols-2 gap-x-10 gap-y-4 text-sm sm:grid-cols-4">
          <Stat label="Bedrooms" value={property.bedrooms} />
          <Stat label="Bathrooms" value={property.bathrooms} />
          <Stat label="Sleeps" value={property.sleeps} />
          <Stat label="Square feet" value={property.sizeSqft?.toLocaleString()} />
        </dl>
      </Container>
    </section>
  );
}

function Stat({ label, value }) {
  return (
    <div>
      <dt className="text-[10px] uppercase tracking-[0.24em] text-brand-cloud/60">{label}</dt>
      <dd className="display mt-1 text-2xl text-brand-cloud">{value ?? '—'}</dd>
    </div>
  );
}
