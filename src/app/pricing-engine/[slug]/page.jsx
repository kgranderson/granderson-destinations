import { notFound } from 'next/navigation';
import Link from 'next/link';
import { NavBar } from '@/components/shared/NavBar';
import { Footer } from '@/components/shared/Footer';
import { Container } from '@/components/shared/Container';
import { PriceCalendar } from '@/components/pricing/PriceCalendar';
import { EventOverridesPanel } from '@/components/pricing/EventOverridesPanel';
import { BasePriceConfig } from '@/components/pricing/BasePriceConfig';
import { PROPERTIES, FEATURE_FLAGS } from '@/lib/constants';
import { getRecommendedPrices } from '@/lib/pricelabs/client';
import { buildEventOverrides } from '@/lib/pricelabs/sync';

export const revalidate = 600;

export async function generateStaticParams() {
  return PROPERTIES.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }) {
  const p = PROPERTIES.find((x) => x.slug === params.slug);
  if (!p) return {};
  return {
    title: `Pricing · ${p.name}`,
    description: `Forward pricing calendar + event-driven overrides for ${p.name}.`,
    robots: { index: false, follow: false },
  };
}

export default async function PricingPropertyPage({ params }) {
  const property = PROPERTIES.find((p) => p.slug === params.slug);
  if (!property) notFound();

  const [prices] = await Promise.all([
    getRecommendedPrices({
      listingId: property.pricelabsListingId || `PL-${property.slug}`,
      days: 60,
    }),
  ]);
  const overrides = buildEventOverrides({ property });

  return (
    <>
      <NavBar />
      <main className="animate-page-in bg-brand-cloud pt-32">
        <Container className="pb-20">
          {/* Header */}
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="text-xs uppercase tracking-[0.32em] text-brand-slate/70">
                Pricing engine · {property.shortName}
              </p>
              <h1 className="display mt-3 text-display-lg text-brand-ink">{property.name}</h1>
              <p className="mt-2 max-w-2xl text-sm text-brand-slate">
                Forward 60-day pricing from PriceLabs, with event-window overrides ready to sync.
                The calendar uses your property&rsquo;s tiered guardrails; events get dedicated min-stay
                rules and recommended ADR.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              {!FEATURE_FLAGS.pricelabsLive() && (
                <span className="rounded-full bg-brand-tan/60 px-3 py-1 text-[10px] uppercase tracking-widest text-brand-slate">
                  Stub · PriceLabs live when key is set
                </span>
              )}
              <Link
                href={`/economics/${property.slug}`}
                className="rounded-full border border-brand-ink px-4 py-2 text-xs font-medium text-brand-ink hover:bg-brand-ink hover:text-brand-cloud"
              >
                Economics →
              </Link>
              <Link
                href={`/destinations/${property.slug}`}
                className="rounded-full border border-brand-ink px-4 py-2 text-xs font-medium text-brand-ink hover:bg-brand-ink hover:text-brand-cloud"
              >
                Public page →
              </Link>
            </div>
          </div>

          {/* Base price + event overrides */}
          <div className="mt-10 grid gap-6 xl:grid-cols-3">
            <BasePriceConfig property={property} />
            <div className="xl:col-span-2">
              <EventOverridesPanel overrides={overrides} propertySlug={property.slug} />
            </div>
          </div>

          {/* Calendar */}
          <div className="mt-8">
            <PriceCalendar
              prices={prices}
              eventWindows={overrides}
              baseAdr={property.baseAdrUsd}
            />
          </div>
        </Container>
      </main>
      <Footer />
    </>
  );
}
