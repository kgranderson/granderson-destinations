import Link from 'next/link';
import { Reveal } from '../shared/Reveal';
import { PROPERTIES } from '@/lib/constants';

export function PropertyShowcase() {
  return (
    <section className="section container" id="destinations">
      <Reveal>
        <div className="section-header">
          <div className="eyebrow">The Portfolio</div>
          <h2>Two homes. Two unmistakable cities.</h2>
          <p className="italic-sub">
            Each property has been operated to top-quartile standards since acquisition. Booking
            opens twelve weeks out.
          </p>
          <div className="header-row">
            <span className="caps" style={{ fontSize: 'var(--text-micro)', color: 'var(--color-text-quiet)' }}>
              Current: 2 · Opening: 3
            </span>
            <Link href="/destinations" className="btn btn-quiet">
              See all properties <span className="arrow">→</span>
            </Link>
          </div>
        </div>
      </Reveal>

      <Reveal stagger>
        <div className="portfolio-grid">
          {PROPERTIES.map((p) => (
            <Link
              key={p.slug}
              href={`/destinations/${p.slug}`}
              className={`property ${p.slug} reveal`}
            >
              <div className="image">
                <div
                  className="photo"
                  style={{
                    backgroundImage: p.coverImage ? `url(${p.coverImage})` : undefined,
                  }}
                />
                <div className="badge">
                  {p.city} ·{' '}
                  {p.country === 'USA' ? 'USA' : p.country === 'Mexico' ? 'MX' : p.country}
                </div>
                {p.fromRateUsd && (
                  <div className="corner">From ${p.fromRateUsd.toLocaleString()} / night</div>
                )}
              </div>
              <div className="meta">
                <h3 className="name">{p.name}</h3>
                <p className="tagline">{p.tagline}</p>
              </div>
            </Link>
          ))}
        </div>
      </Reveal>
    </section>
  );
}
