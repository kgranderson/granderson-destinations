'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useState } from 'react';
import { ArrowUpRight } from 'lucide-react';
import { dateRange } from '@/lib/utils/format';

/**
 * Client component for graceful image-error fallback (some Unsplash
 * IDs in seed data may 404; future Google Place / Supabase URLs may
 * also fail).
 */
export function EventCard({ event, detail }) {
  const [failed, setFailed] = useState(false);
  const showGradient = !detail?.image || failed;

  return (
    <Link
      href={`/events/${event.slug}`}
      className="group relative block overflow-hidden rounded-2xl bg-brand-ink shadow-soft transition-shadow hover:shadow-lift"
    >
      <div className="relative aspect-[4/5] w-full overflow-hidden">
        {showGradient ? (
          <div className="h-full w-full bg-[radial-gradient(120%_80%_at_30%_30%,#3F4A56,#0E1116)]" />
        ) : (
          <Image
            src={detail.image}
            alt={event.name}
            fill
            sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
            className="object-cover opacity-90 transition-transform duration-[1200ms] ease-out-quint group-hover:scale-[1.06]"
            onError={() => setFailed(true)}
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-brand-ink via-brand-ink/40 to-transparent" />
      </div>

      <div className="absolute inset-x-0 bottom-0 p-6 text-brand-cloud">
        <p className="text-[10px] uppercase tracking-[0.32em] text-brand-cloud/75">
          {event.market.replace(/-/g, ' ')} · {dateRange(event.startDate, event.endDate)}
        </p>
        <h3 className="display mt-2 text-2xl text-brand-cloud sm:text-3xl">{event.name}</h3>

        <div className="mt-5 grid grid-cols-3 gap-2">
          <Pill label="ADR uplift" value={`+${Math.round((event.adrUpliftPct - 1) * 100)}%`} />
          <Pill label="Occ. uplift" value={`+${Math.round(event.occupancyUpliftPct * 100)} pp`} />
          <Pill label="Min stay" value={`${event.minStayNights} nts`} />
        </div>

        <p className="mt-5 inline-flex items-center gap-1 text-sm text-brand-cloud/85 underline-offset-4 group-hover:underline">
          See the playbook <ArrowUpRight size={14} />
        </p>
      </div>
    </Link>
  );
}

function Pill({ label, value }) {
  return (
    <div className="rounded-xl bg-brand-cloud/10 px-2.5 py-1.5 backdrop-blur-sm">
      <p className="text-[9px] uppercase tracking-widest text-brand-cloud/70">{label}</p>
      <p className="mt-0.5 text-sm font-medium text-brand-cloud">{value}</p>
    </div>
  );
}
