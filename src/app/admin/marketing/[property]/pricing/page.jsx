import { redirect, notFound } from 'next/navigation';
import Link from 'next/link';
import { Tags } from 'lucide-react';
import { NavBar } from '@/components/shared/NavBar';
import { Footer } from '@/components/shared/Footer';
import { AdminNav } from '@/components/shared/AdminNav';
import { PropertyMarketingTabs } from '@/components/admin/PropertyMarketingTabs';
import { isOwner } from '@/lib/admin/owner-auth';
import { PROPERTIES, FEATURE_FLAGS } from '@/lib/constants';
import { listListings, getRecommendedPrices } from '@/lib/pricelabs/client';
import { buildEventOverrides } from '@/lib/pricelabs/sync';
import { PricingCockpit } from './PricingCockpit';

export const metadata = {
  title: 'Marketing · Pricing',
  robots: { index: false, follow: false },
};
export const dynamic = 'force-dynamic';

/**
 * PriceLabs cockpit for a single property. Pulls 90-day recommended
 * pricing from PriceLabs (live key) or returns deterministic stub data
 * (no key), overlays the calculated event-uplift windows, and surfaces
 * the "Push to PriceLabs" CTA + per-day override editor.
 *
 * The cockpit deliberately doesn't try to be a price-prediction engine
 * itself — PriceLabs already does that. This is the operator's
 * supervisory layer: see, adjust, push.
 */
export default async function PricingCockpitPage({ params }) {
  const auth = await isOwner();
  const p = params instanceof Promise ? await params : params;
  if (!auth.authed) redirect(`/admin/login?redirect=/admin/marketing/${p.property}/pricing`);
  const profile = auth.profile || { full_name: 'Owner', email: null };

  const property = PROPERTIES.find((x) => x.slug === p.property);
  if (!property) notFound();

  // PriceLabs listing match — slug-based naming convention from the
  // stub data ("PL-PS-001" for palm-springs). Future: persist the
  // mapping as properties.pricelabs_listing_id and look it up here.
  // listListings now returns { source, listings, failed?, error? } so
  // we can distinguish "PriceLabs down" from "no matching listing".
  const listingsResult = await listListings();
  const pricelabsFailed = !!listingsResult.failed;
  const matchedListing =
    listingsResult.listings.find((l) =>
      l.name?.toLowerCase().includes((property.shortName || property.name).toLowerCase()),
    ) || listingsResult.listings[0];

  // 90-day forward recommended pricing (the granularity guests see at
  // checkout). We trim to 90 instead of the 365 the client offers so
  // the table stays readable; longer-horizon overrides come from the
  // event-override builder below.
  const prices = matchedListing
    ? await getRecommendedPrices({ listingId: matchedListing.listing_id, days: 90 })
    : [];

  // Event-driven override windows for the next 365 days
  const eventOverrides = buildEventOverrides({ property, lookaheadDays: 365 });

  // Aggregate KPIs the operator actually wants at-a-glance
  const last90 = prices.slice(0, 90);
  const weekendDays = last90.filter((row) => {
    const d = new Date(row.date);
    return d.getDay() === 5 || d.getDay() === 6;
  });
  const weekdayDays = last90.filter((row) => {
    const d = new Date(row.date);
    return d.getDay() !== 5 && d.getDay() !== 6;
  });
  const avg = (arr) => (arr.length ? Math.round(arr.reduce((s, r) => s + r.price, 0) / arr.length) : 0);
  const weekendAvg = avg(weekendDays);
  const weekdayAvg = avg(weekdayDays);
  const blendedAvg = avg(last90);

  return (
    <>
      <NavBar />
      <main className="animate-page-in bg-brand-cloud pt-24 lg:pt-28">
        <div className="mx-auto flex max-w-[88rem]">
          <AdminNav profile={profile} />

          <div className="min-w-0 flex-1 px-5 py-10 sm:px-8 lg:px-10">
            <div className="flex flex-wrap items-baseline justify-between gap-4">
              <div>
                <p className="text-xs uppercase tracking-[0.32em] text-brand-slate/70">
                  Marketing · {property.shortName}
                </p>
                <h1 className="display mt-2 text-display-lg text-brand-ink">{property.name}</h1>
                <p className="mt-2 text-sm text-brand-slate">
                  PriceLabs cockpit — live 90-day pricing, event-driven override windows, and
                  one-click push to your PriceLabs listing.
                </p>
              </div>
              <Link
                href="/admin/marketing"
                className="text-sm text-brand-slate underline-offset-4 hover:underline"
              >
                ← All properties
              </Link>
            </div>

            <div className="mt-6">
              <PropertyMarketingTabs propertySlug={property.slug} />
            </div>

            {/* KPI strip */}
            <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <KPI label="Blended ADR (90d)" value={fmtUsd(blendedAvg)} sub="weighted by day" />
              <KPI label="Weekend ADR" value={fmtUsd(weekendAvg)} sub="Fri + Sat" />
              <KPI label="Weekday ADR" value={fmtUsd(weekdayAvg)} sub="Sun–Thu" />
              <KPI
                label="Event uplift windows"
                value={eventOverrides.length}
                sub={eventOverrides[0]?.label || 'none scheduled'}
              />
            </div>

            {/* PriceLabs listing details */}
            {pricelabsFailed ? (
              <section className="mt-8 rounded-2xl border border-rose-200 bg-rose-50/60 p-5 text-sm text-rose-800">
                <strong>PriceLabs API unreachable.</strong> Listings couldn&rsquo;t be loaded.
                Pushes are disabled until the API recovers.
                {listingsResult.error && (
                  <span className="ml-2 font-mono text-xs">({listingsResult.error})</span>
                )}
              </section>
            ) : !matchedListing ? (
              <section className="mt-8 rounded-2xl border border-rose-200 bg-rose-50/60 p-5 text-sm text-rose-800">
                No PriceLabs listing matched <strong>{property.name}</strong>. Either{' '}
                <code className="rounded bg-rose-100 px-1">PRICELABS_API_KEY</code> isn&rsquo;t
                set, or the listing name in PriceLabs doesn&rsquo;t include the property short
                name. Add the listing in PriceLabs first, then refresh.
              </section>
            ) : (
              <section className="mt-8 rounded-2xl border border-brand-tan/60 bg-brand-cloud p-5">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-brand-ink text-brand-cloud">
                      <Tags size={14} />
                    </span>
                    <div>
                      <p className="text-xs uppercase tracking-widest text-brand-slate/70">
                        PriceLabs listing
                      </p>
                      <p className="text-sm font-medium text-brand-ink">
                        {matchedListing.name}{' '}
                        <span className="ml-1 font-mono text-xs text-brand-slate/70">
                          ({matchedListing.listing_id})
                        </span>
                      </p>
                    </div>
                  </div>
                  <ModeBadge live={FEATURE_FLAGS.pricelabsLive()} />
                </div>
              </section>
            )}

            {/* Interactive cockpit */}
            {matchedListing && (
              <div className="mt-8">
                <PricingCockpit
                  propertySlug={property.slug}
                  listingId={matchedListing.listing_id}
                  initialPrices={prices}
                  eventOverrides={eventOverrides}
                />
              </div>
            )}
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}

function fmtUsd(n) {
  if (typeof n !== 'number' || !Number.isFinite(n)) return '—';
  return `$${n.toLocaleString()}`;
}

function KPI({ label, value, sub }) {
  return (
    <div className="rounded-2xl border border-brand-tan/60 bg-brand-cloud p-5 shadow-soft">
      <p className="text-xs uppercase tracking-[0.22em] text-brand-slate/70">{label}</p>
      <p className="display mt-2 text-3xl text-brand-ink tabular-nums">{value}</p>
      {sub && <p className="mt-1 text-xs text-brand-slate/70">{sub}</p>}
    </div>
  );
}

function ModeBadge({ live }) {
  return (
    <span className="inline-flex items-center gap-2 rounded-full border border-brand-tan/60 bg-brand-sand/40 px-3 py-1 text-xs">
      <span
        className={`h-1.5 w-1.5 rounded-full ${live ? 'bg-brand-jade' : 'bg-brand-tan'}`}
        aria-hidden
      />
      <span className="font-medium text-brand-ink">{live ? 'Live PriceLabs API' : 'Stub mode'}</span>
    </span>
  );
}
