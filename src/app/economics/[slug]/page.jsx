import { notFound } from 'next/navigation';
import Link from 'next/link';
import { NavBar } from '@/components/shared/NavBar';
import { Footer } from '@/components/shared/Footer';
import { Container } from '@/components/shared/Container';
import { KPICards } from '@/components/economics/KPICards';
import { RevenueChart } from '@/components/economics/RevenueChart';
import { ExpenseBreakdown } from '@/components/economics/ExpenseBreakdown';
import { CompPanel } from '@/components/economics/CompPanel';
import { ExpenseAnomalies } from '@/components/economics/ExpenseAnomalies';
import { WhatIfPanel } from '@/components/economics/WhatIfPanel';
import { ImportTriggerLink } from '@/components/economics/ImportTriggerLink';
import { PROPERTIES, MARKETS } from '@/lib/constants';
import { loadMonthly } from '@/lib/economics/loader';
import { rollupMonthly, withDerived, compRank, flagExpenses } from '@/lib/economics/model';
import { generateFinancialsSeed, categoryBaselines } from '@/lib/economics/seed';
import { getMarketSummary, getCompSet } from '@/lib/airdna/client';

export const revalidate = 600;

export async function generateStaticParams() {
  return PROPERTIES.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }) {
  const p = PROPERTIES.find((x) => x.slug === params.slug);
  if (!p) return {};
  return {
    title: `Economics · ${p.name}`,
    description: `Trailing-12 revenue, expense flagging, AirDNA comp benchmarking, and revenue-lever modeling for ${p.name}.`,
    robots: { index: false, follow: false },
  };
}

export default async function EconomicsPage({ params }) {
  const property = PROPERTIES.find((x) => x.slug === params.slug);
  if (!property) notFound();

  const market = MARKETS[property.slug];
  const { rows, stub: dataStub, baselines: rawBaselines } = await loadMonthly(property.slug);

  // Build the rollup + derived series
  const rolled = withDerived(rollupMonthly(rows));
  const baselines =
    rawBaselines || categoryBaselines(generateFinancialsSeed(), property.slug);

  // KPIs (trailing 12 vs prior 12)
  const ttm = rolled.slice(-12);
  const prior = rolled.slice(-24, -12);
  const sum = (arr, k) => arr.reduce((s, m) => s + (m[k] || 0), 0);
  const ttmRevenue = sum(ttm, 'revenue');
  const priorRevenue = sum(prior, 'revenue');
  const ttmExpense = sum(ttm, 'expenses');
  const priorExpense = sum(prior, 'expenses');
  const ttmNoi = ttmRevenue - ttmExpense;
  const priorNoi = priorRevenue - priorExpense;

  const lastMonth = rolled[rolled.length - 1] || { revenue: 0 };
  const lastMonthLY = rolled[rolled.length - 13] || { revenue: 0 };
  const days30 = 30;
  const revPar30 = (lastMonth.revenue || 0) / days30;
  const revPar30LY = (lastMonthLY.revenue || 0) / days30;

  const kpis = {
    ttmRevenue,
    ttmExpense,
    ttmNoi,
    margin: ttmRevenue > 0 ? ttmNoi / ttmRevenue : 0,
    revYoy: priorRevenue > 0 ? (ttmRevenue - priorRevenue) / priorRevenue : 0,
    expYoy: priorExpense > 0 ? (ttmExpense - priorExpense) / priorExpense : 0,
    noiYoy: priorNoi > 0 ? (ttmNoi - priorNoi) / priorNoi : 0,
    marginYoy:
      priorRevenue > 0 ? ttmNoi / ttmRevenue - priorNoi / priorRevenue : 0,
    revPar30,
    revPar30Yoy: revPar30LY > 0 ? (revPar30 - revPar30LY) / revPar30LY : 0,
    lastMonthRevenue: lastMonth.revenue,
    lastMonthYoy:
      lastMonthLY.revenue > 0
        ? (lastMonth.revenue - lastMonthLY.revenue) / lastMonthLY.revenue
        : 0,
  };

  // AirDNA comp set
  const [marketSummary, compSet] = await Promise.all([
    getMarketSummary(market?.airdnaMarketCode || property.airdnaMarketCode),
    getCompSet({
      marketCode: market?.airdnaMarketCode || property.airdnaMarketCode,
      bedrooms: property.bedrooms,
      accommodates: property.sleeps,
    }),
  ]);

  // Property-level ADR + RevPAR derived from last 30d
  const propertyAdr = property.baseAdrUsd || 600;
  const propertyOcc = 0.66; // TODO(M5): derive from PriceLabs trailing-30d realized
  const propertyRevPar = +(propertyAdr * propertyOcc).toFixed(2);
  const rank = compRank({ propertyAdr, propertyRevPar, compSet });

  // Build per-category comp medians from market ADR + industry expense ratios.
  // Approximation: avg-month gross = marketADR × marketOcc × 30; multiply by category
  // expense ratio to get a typical-month category spend across the comp set.
  const marketGrossMonthly =
    (marketSummary?.adr || propertyAdr) * (marketSummary?.occupancy || 0.6) * 30;
  const COMP_RATIOS = {
    Cleaning: 0.115,
    'Property management': 0.08,
    Utilities: 0.05,
    'Pool & landscaping': 0.045,
    'Gardener & courtyard': 0.03,
    Maintenance: 0.04,
    Insurance: 0.025,
    'Property tax': 0.05,
    'Lodging tax remitted': 0.1,
    'Marketing & OTA fees': 0.085,
    'Supplies & restock': 0.025,
    Concierge: 0.02,
  };
  const compMedians = Object.fromEntries(
    Object.entries(COMP_RATIOS).map(([cat, r]) => [cat, marketGrossMonthly * r]),
  );

  // Flag expense outliers (both σ-based and baseline-based now active)
  const flagged = flagExpenses({ monthly: rolled, compMedians, baselines });

  return (
    <>
      <NavBar />
      <main className="animate-page-in bg-brand-cloud pt-32">
        <Container className="pb-20">
          {/* Header */}
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="text-xs uppercase tracking-[0.32em] text-brand-slate/70">
                Economics · {property.shortName}
              </p>
              <h1 className="display mt-3 text-display-lg text-brand-ink">{property.name}</h1>
              <p className="mt-2 max-w-2xl text-sm text-brand-slate">
                Trailing-twelve performance, comp-set benchmarking, expense outlier detection, and
                revenue-lever modeling. Refreshed every 10 minutes.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              {(dataStub || compSet?.stub) && (
                <span className="rounded-full bg-brand-tan/60 px-3 py-1 text-[10px] uppercase tracking-widest text-brand-slate">
                  {dataStub && compSet?.stub
                    ? 'Synthetic data + stub comps'
                    : dataStub
                    ? 'Synthetic data'
                    : 'Stub AirDNA'}
                </span>
              )}
              <ImportTriggerLink propertySlug={property.slug} />
              <Link
                href={`/destinations/${property.slug}`}
                className="rounded-full border border-brand-ink px-4 py-2 text-xs font-medium text-brand-ink hover:bg-brand-ink hover:text-brand-cloud"
              >
                Public page →
              </Link>
            </div>
          </div>

          {/* KPIs */}
          <div className="mt-10">
            <KPICards kpis={kpis} />
          </div>

          {/* Charts row */}
          <div className="mt-8 grid gap-6 xl:grid-cols-2">
            <RevenueChart monthly={rolled} />
            <ExpenseBreakdown monthly={rolled} />
          </div>

          {/* Comps + anomalies row */}
          <div className="mt-8 grid gap-6 xl:grid-cols-2">
            <CompPanel
              marketSummary={marketSummary}
              compRank={rank}
              propertyAdr={propertyAdr}
              propertyRevPar={propertyRevPar}
              isStub={!!compSet?.stub}
            />
            <ExpenseAnomalies flagged={flagged} />
          </div>

          {/* What-if */}
          <div className="mt-8">
            <WhatIfPanel
              baseAdr={propertyAdr}
              baseOccupancy={propertyOcc}
              lastMonthRevenue={lastMonth.revenue}
            />
          </div>
        </Container>
      </main>
      <Footer />
    </>
  );
}
