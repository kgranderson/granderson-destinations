import Link from 'next/link';
import { Container } from '../shared/Container';
import { Reveal } from '../shared/Reveal';
import { ANCHOR_EVENTS_SEED } from '@/lib/constants';
import { dateRange } from '@/lib/utils/format';
import { calcEventPremium } from '@/lib/events/premium';
import { ArrowUpRight } from 'lucide-react';

export function PropertyEvents({ property }) {
  // Future-only events for this property's market, soonest first.
  const todayIso = new Date().toISOString().slice(0, 10);
  const events = ANCHOR_EVENTS_SEED
    .filter((e) => e.market === property.slug && e.endDate >= todayIso)
    .sort((a, b) => a.startDate.localeCompare(b.startDate))
    .slice(0, 4);

  if (!events.length) return null;

  return (
    <section className="bg-brand-ink py-20 text-brand-cloud sm:py-28">
      <Container>
        <div className="flex items-end justify-between">
          <Reveal>
            <p className="text-xs uppercase tracking-[0.32em] text-brand-cloud/70">Plan around the calendar</p>
            <h2 className="display mt-3 text-display-lg text-brand-cloud">
              Stay during the events that move this market.
            </h2>
          </Reveal>
          <Link href="/events" className="hidden text-sm text-brand-cloud/80 underline-offset-4 hover:underline sm:block">
            See all events →
          </Link>
        </div>

        <div className="mt-10 grid gap-4 stagger-grid md:grid-cols-2">
          {events.map((e) => {
            const premium = calcEventPremium({
              baseAdrUsd: property.baseAdrUsd ?? 600,
              occupancyBaseline: 0.6,
              event: e,
              nights: e.minStayNights,
            });
            return (
              <Reveal key={e.slug}>
                <article className="rounded-2xl border border-brand-cloud/15 bg-brand-cloud/5 p-6 backdrop-blur-sm">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h3 className="text-lg font-medium text-brand-cloud">{e.name}</h3>
                      <p className="text-sm text-brand-cloud/70">{dateRange(e.startDate, e.endDate)}</p>
                    </div>
                    <ArrowUpRight className="shrink-0 text-brand-gold" size={18} />
                  </div>

                  <div className="mt-5 grid grid-cols-3 gap-3 text-sm">
                    <Stat label="ADR uplift" value={`+${Math.round((e.adrUpliftPct - 1) * 100)}%`} />
                    <Stat label="Occ. uplift" value={`+${Math.round(e.occupancyUpliftPct * 100)} pp`} />
                    <Stat label="Min stay" value={`${e.minStayNights} nts`} />
                  </div>

                  {premium && (
                    <p className="mt-5 text-xs leading-relaxed text-brand-cloud/75">
                      <span className="text-brand-gold">Indicative window:</span>{' '}
                      ${premium.recommendedAdr.toLocaleString()}/night · projected revenue lift of approximately
                      ${premium.liftUsd.toLocaleString()} over the event window vs. baseline pricing.
                    </p>
                  )}
                </article>
              </Reveal>
            );
          })}
        </div>
      </Container>
    </section>
  );
}

function Stat({ label, value }) {
  return (
    <div className="rounded-xl bg-brand-cloud/5 px-3 py-2">
      <p className="text-[10px] uppercase tracking-[0.2em] text-brand-cloud/55">{label}</p>
      <p className="mt-0.5 font-medium text-brand-cloud">{value}</p>
    </div>
  );
}
