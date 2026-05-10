import Link from 'next/link';
import { ArrowUpRight } from 'lucide-react';
import { NavBar } from '@/components/shared/NavBar';
import { Footer } from '@/components/shared/Footer';
import { Container } from '@/components/shared/Container';
import { PROPERTIES } from '@/lib/constants';
import { buildEventOverrides } from '@/lib/pricelabs/sync';
import { usd } from '@/lib/utils/format';

export const revalidate = 600;

export const metadata = {
  title: 'Pricing engine',
  description: 'PriceLabs dynamic pricing across the Granderson Destinations portfolio.',
  robots: { index: false, follow: false },
};

export default function PricingIndex() {
  const blocks = PROPERTIES.map((p) => {
    const overrides = buildEventOverrides({ property: p });
    return {
      property: p,
      eventOverrideCount: overrides.length,
      nextEvent: overrides[0] || null,
    };
  });

  return (
    <>
      <NavBar />
      <main className="animate-page-in bg-brand-cloud pt-32">
        <Container className="pb-20">
          <p className="text-xs uppercase tracking-[0.32em] text-brand-slate/70">Pricing engine</p>
          <h1 className="display mt-3 text-display-lg text-brand-ink">Dynamic pricing dashboard</h1>
          <p className="mt-2 max-w-2xl text-sm text-brand-slate">
            Forward pricing, event-driven overrides, and one-click sync to PriceLabs across every
            property in the portfolio.
          </p>

          <div className="mt-10 grid gap-6 md:grid-cols-2">
            {blocks.map((b) => (
              <Link
                key={b.property.slug}
                href={`/pricing-engine/${b.property.slug}`}
                className="group block rounded-2xl border border-brand-tan/60 bg-brand-cloud p-6 shadow-soft transition-shadow hover:shadow-lift"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-[10px] uppercase tracking-widest text-brand-slate/70">
                      {b.property.city} · {b.property.country}
                    </p>
                    <h2 className="display mt-1 text-2xl text-brand-ink">{b.property.name}</h2>
                  </div>
                  <ArrowUpRight className="text-brand-gold transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
                </div>

                <dl className="mt-5 grid grid-cols-3 gap-3">
                  <Mini label="Base ADR" value={usd(b.property.baseAdrUsd || 0)} />
                  <Mini label="Event overrides" value={`${b.eventOverrideCount}`} />
                  <Mini
                    label="Next event"
                    value={b.nextEvent ? b.nextEvent.eventName.split(' — ')[0].split(' (')[0] : '—'}
                  />
                </dl>
              </Link>
            ))}
          </div>
        </Container>
      </main>
      <Footer />
    </>
  );
}

function Mini({ label, value }) {
  return (
    <div className="rounded-xl bg-brand-sand/40 px-3 py-2">
      <p className="text-[10px] uppercase tracking-widest text-brand-slate/70">{label}</p>
      <p className="display mt-0.5 text-base text-brand-ink truncate">{value}</p>
    </div>
  );
}
