'use client';

import Image from 'next/image';
import { useState } from 'react';
import { Star, ExternalLink, Clock, Car } from 'lucide-react';

/**
 * Client component because we need onError to gracefully swap to a
 * gradient placeholder when an upstream image (Unsplash, Google Place
 * Photos, Supabase Storage) 404s — next/image renders a broken image
 * silently otherwise, which leaves a blank tile in the grid.
 */
export function HotspotCard({ hotspot, featured = false }) {
  const h = hotspot;
  const [failed, setFailed] = useState(false);
  const showGradient = !h.image || failed;

  return (
    <article
      className={`group relative overflow-hidden rounded-2xl border border-brand-tan/60 bg-brand-cloud shadow-soft transition-shadow hover:shadow-lift ${
        featured ? 'sm:col-span-2 sm:row-span-2' : ''
      }`}
    >
      <div className={`relative w-full overflow-hidden bg-brand-sand ${featured ? 'aspect-[16/10]' : 'aspect-[4/3]'}`}>
        {showGradient ? (
          <GradientPlaceholder name={h.name} />
        ) : (
          <Image
            src={h.image}
            alt={`${h.name} — ${h.category} in ${h.neighborhood}`}
            fill
            sizes={featured ? '(min-width: 1024px) 50vw, 100vw' : '(min-width: 768px) 33vw, 100vw'}
            className="object-cover transition-transform duration-[1200ms] ease-out-quint group-hover:scale-[1.04]"
            onError={() => setFailed(true)}
          />
        )}
        <div className="absolute right-3 top-3 flex items-center gap-1 rounded-full bg-brand-ink/85 px-2.5 py-1 text-xs text-brand-cloud backdrop-blur">
          <Star size={12} fill="currentColor" className="text-brand-gold" />
          {h.rating?.toFixed(1)}
        </div>
        {h.priceLevel ? (
          <div className="absolute left-3 top-3 rounded-full bg-brand-cloud/85 px-2 py-0.5 text-xs font-medium text-brand-ink backdrop-blur">
            {'$'.repeat(h.priceLevel)}
          </div>
        ) : null}
      </div>

      <div className="p-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-[10px] uppercase tracking-[0.22em] text-brand-slate/70">
              {h.category.replace('-', ' ')} · {h.neighborhood}
            </p>
            <h3 className={`mt-1 font-medium text-brand-ink ${featured ? 'text-2xl display' : 'text-lg'}`}>
              {h.name}
            </h3>
          </div>
          {h.website && (
            <a
              href={h.website}
              target="_blank"
              rel="noreferrer noopener"
              aria-label={`${h.name} website`}
              className="shrink-0 rounded-full bg-brand-sand/60 p-2 text-brand-slate transition-colors hover:bg-brand-tan/60 hover:text-brand-ink"
            >
              <ExternalLink size={14} />
            </a>
          )}
        </div>

        <p className={`mt-3 text-sm leading-relaxed text-brand-slate ${featured ? '' : 'line-clamp-3'}`}>
          {h.description}
        </p>

        {h.tags?.length ? (
          <ul className="mt-4 flex flex-wrap gap-1.5">
            {h.tags.map((t) => (
              <li
                key={t}
                className="rounded-full border border-brand-tan/60 bg-brand-sand/40 px-2 py-0.5 text-[11px] text-brand-slate"
              >
                {t}
              </li>
            ))}
          </ul>
        ) : null}

        <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-brand-slate">
          {h.hours && (
            <span className="inline-flex items-center gap-1">
              <Clock size={12} /> {h.hours}
            </span>
          )}
          {typeof h.minutesDrive === 'number' && h.minutesDrive > 0 && (
            <span className="inline-flex items-center gap-1">
              <Car size={12} /> {h.minutesDrive} min
            </span>
          )}
        </div>
      </div>
    </article>
  );
}

/**
 * Branded gradient placeholder with a typographic mark — used as the
 * fallback for any hotspot without a working image. Uses the
 * hotspot's name as a subtle watermark so the tile doesn't look empty.
 */
function GradientPlaceholder({ name }) {
  // Pick a deterministic accent based on the name so each placeholder feels distinct
  const accents = [
    'from-brand-tan to-brand-sand',
    'from-brand-sand to-brand-cloud',
    'from-brand-rose/30 to-brand-sand',
    'from-brand-jade/20 to-brand-sand',
    'from-brand-gold/25 to-brand-sand',
    'from-brand-terracotta/20 to-brand-sand',
  ];
  const idx = (name?.length || 0) % accents.length;
  return (
    <div
      className={`flex h-full w-full items-end justify-start bg-gradient-to-br p-6 ${accents[idx]}`}
      aria-hidden
    >
      <p className="display max-w-[80%] text-2xl leading-tight text-brand-slate/40 sm:text-3xl">
        {name}
      </p>
    </div>
  );
}
