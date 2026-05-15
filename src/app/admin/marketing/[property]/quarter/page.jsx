import { redirect, notFound } from 'next/navigation';
import Link from 'next/link';
import { NavBar } from '@/components/shared/NavBar';
import { Footer } from '@/components/shared/Footer';
import { AdminNav } from '@/components/shared/AdminNav';
import { PropertyMarketingTabs } from '@/components/admin/PropertyMarketingTabs';
import { isOwner } from '@/lib/admin/owner-auth';
import { PROPERTIES, FEATURE_FLAGS } from '@/lib/constants';
import { getAdminClient } from '@/lib/supabase/admin';
import {
  buildQuarterPlan,
  loadCachedQuarterPlan,
  getCurrentQuarter,
  getQuarterWindow,
  quarterLabel,
  shiftQuarter,
} from '@/lib/marketing/quarterly';
import { QuarterView } from './QuarterView';

export const metadata = { title: 'Marketing · Quarter plan', robots: { index: false, follow: false } };
export const dynamic = 'force-dynamic';

/**
 * Phase B — Quarterly market plan.
 *
 * Renders a property-scoped, quarter-scoped synthesis: anchor events +
 * Perplexity intel items + recommended premium booking windows. Loads
 * the cached plan from marketing_quarterly_plans when fresh (<7 days);
 * otherwise builds a fresh in-memory plan from current intel_items.
 * The "Refresh from Perplexity" button on the page triggers a live
 * fetch and re-caches.
 */
export default async function QuarterPlanPage({ params, searchParams }) {
  const auth = await isOwner();
  const p = params instanceof Promise ? await params : params;
  const sp = searchParams instanceof Promise ? await searchParams : searchParams;
  if (!auth.authed) redirect(`/admin/login?redirect=/admin/marketing/${p.property}/quarter`);
  const profile = auth.profile || { full_name: 'Owner', email: null };

  const property = PROPERTIES.find((x) => x.slug === p.property);
  if (!property) notFound();

  // Quarter selection: ?year=YYYY&quarter=N from query, else current
  const current = getCurrentQuarter();
  const year = Number(sp?.year) || current.year;
  const quarter = Number(sp?.quarter) || current.quarter;
  if (!Number.isInteger(year) || year < 2020 || year > 2099 || quarter < 1 || quarter > 4) {
    redirect(`/admin/marketing/${property.slug}/quarter`);
  }

  const window = getQuarterWindow(year, quarter);

  // Hydrate the property record with its DB id (needed for cache lookup)
  const supabase = getAdminClient();
  let propertyWithId = { ...property };
  if (supabase && !property.id) {
    const { data } = await supabase
      .from('properties')
      .select('id, base_adr_usd')
      .eq('slug', property.slug)
      .maybeSingle();
    if (data) propertyWithId = { ...property, ...data };
  }

  // Load from cache; if missing or stale, build live (without re-hitting
  // Perplexity — that requires the explicit Refresh button click).
  const cached = await loadCachedQuarterPlan({
    property: propertyWithId,
    year,
    quarter,
  });

  const plan = await buildQuarterPlan({
    property: propertyWithId,
    year,
    quarter,
  });
  // If we have a cached intel summary, prefer it (the Perplexity-derived
  // text is more useful than the deterministic composed fallback).
  if (cached?.intel_summary?.text) {
    plan.intelSummary = cached.intel_summary.text;
  }
  plan.cacheState = cached
    ? cached.stale
      ? 'stale'
      : 'fresh'
    : 'none';
  plan.generatedAt = cached?.generated_at || plan.generatedAt;

  const prevQ = shiftQuarter(year, quarter, -1);
  const nextQ = shiftQuarter(year, quarter, 1);
  const perplexityLive = FEATURE_FLAGS.perplexityLive
    ? FEATURE_FLAGS.perplexityLive()
    : !!process.env.PERPLEXITY_API_KEY;

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
                  Quarterly market plan — anchor events, Perplexity intel, and recommended
                  premium booking windows. Push the whole quarter to PriceLabs in one click.
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

            <QuarterView
              propertySlug={property.slug}
              year={year}
              quarter={quarter}
              window={window}
              plan={plan}
              prevQ={prevQ}
              nextQ={nextQ}
              perplexityLive={perplexityLive}
            />
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
