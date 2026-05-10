import Image from 'next/image';
import { Star, ExternalLink, Clock, Car } from 'lucide-react';

export function HotspotCard({ hotspot, featured = false }) {
  const h = hotspot;
  return (
    <article
      className={`group relative overflow-hidden rounded-2xl border border-brand-tan/60 bg-brand-cloud shadow-soft transition-shadow hover:shadow-lift ${
        featured ? 'sm:col-span-2 sm:row-span-2' : ''
      }`}
    >
      <div className={`relative w-full overflow-hidden bg-brand-sand ${featured ? 'aspect-[16/10]' : 'aspect-[4/3]'}`}>
        {h.image ? (
          <Image
            src={h.image}
            alt={h.name}
            fill
            sizes={featured ? '(min-width: 1024px) 50vw, 100vw' : '(min-width: 768px) 33vw, 100vw'}
            className="object-cover transition-transform duration-[1200ms] ease-out-quint group-hover:scale-[1.04]"
          />
        ) : (
          <div className="h-full w-full bg-[radial-gradient(120%_80%_at_30%_30%,#E8DCC6,#F5EFE6)]" />
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
