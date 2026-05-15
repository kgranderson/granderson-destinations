import 'server-only';
/**
 * Quarterly market plan synthesis.
 *
 * For a given property and year+quarter, fuses three data sources
 * already wired elsewhere in the codebase into one operator-facing
 * "what's the next 3 months going to look like" view:
 *
 *  1. Anchor events from ANCHOR_EVENTS_SEED whose start..end overlap
 *     the quarter window. Each event carries an ADR uplift % and
 *     min-stay recommendation from src/lib/events/data.js.
 *  2. Intel items from public.intel_items (the Perplexity feed
 *     refreshed weekly by /api/intel/refresh) whose earliest_date or
 *     latest_date fall inside the quarter.
 *  3. Premium booking windows synthesized from #1 — each window is a
 *     date range, label, and recommended ADR uplift that the operator
 *     can one-click push to PriceLabs.
 *
 * Results are cached in public.marketing_quarterly_plans so the
 * dashboard doesn't re-synthesize on every page load. The "Refresh
 * from Perplexity" button on the quarter view re-runs intel fetch
 * and re-saves the cache.
 */
import { ANCHOR_EVENTS_SEED, MARKETS } from '@/lib/constants';
import { calcEventPremium } from '@/lib/events/premium';
import { fetchMarketIntel } from '@/lib/perplexity/intel';
import { getAdminClient } from '@/lib/supabase/admin';

// =========================================================
// Quarter date math
// =========================================================

/** Current quarter as { year, quarter } (1..4) in property's time zone (UTC fallback). */
export function getCurrentQuarter() {
  const now = new Date();
  const year = now.getUTCFullYear();
  const quarter = Math.floor(now.getUTCMonth() / 3) + 1;
  return { year, quarter };
}

/** First day (inclusive) and last day (exclusive) of a quarter, as ISO YYYY-MM-DD strings. */
export function getQuarterWindow(year, quarter) {
  if (!Number.isInteger(quarter) || quarter < 1 || quarter > 4) {
    throw new Error(`invalid quarter: ${quarter}`);
  }
  const startMonth = (quarter - 1) * 3; // 0..9
  const endMonth = startMonth + 3;      // 3..12 (used to compute end-exclusive)
  const startDate = new Date(Date.UTC(year, startMonth, 1));
  const endDateExclusive = new Date(Date.UTC(year, endMonth, 1));
  // For inclusive end-date display (last day of the quarter), subtract 1 day
  const endDateInclusive = new Date(endDateExclusive.getTime() - 86_400_000);
  return {
    startIso: startDate.toISOString().slice(0, 10),
    endIso: endDateInclusive.toISOString().slice(0, 10),
    endExclusiveIso: endDateExclusive.toISOString().slice(0, 10),
    label: quarterLabel(year, quarter),
    months: [
      monthLabel(year, startMonth),
      monthLabel(year, startMonth + 1),
      monthLabel(year, startMonth + 2),
    ],
  };
}

/** "Q3 2026 · Jul–Sep" */
export function quarterLabel(year, quarter) {
  const monthsByQ = [
    ['Jan', 'Mar'],
    ['Apr', 'Jun'],
    ['Jul', 'Sep'],
    ['Oct', 'Dec'],
  ];
  const [from, to] = monthsByQ[quarter - 1];
  return `Q${quarter} ${year} · ${from}–${to}`;
}

function monthLabel(year, monthIdx) {
  const d = new Date(Date.UTC(year, monthIdx, 1));
  return {
    year,
    monthIdx,
    short: d.toLocaleString('en-US', { month: 'short', timeZone: 'UTC' }),
    long: d.toLocaleString('en-US', { month: 'long', timeZone: 'UTC' }),
  };
}

/** Step a quarter forward or backward (returns { year, quarter }). */
export function shiftQuarter(year, quarter, delta) {
  const total = year * 4 + (quarter - 1) + delta;
  // JS `%` preserves sign — `(-1) % 4 === -1`. The `+4) % 4` dance
  // normalizes negative totals so we don't return Q0 or negative quarters.
  const yearOut = Math.floor(total / 4);
  const quarterOut = ((total % 4) + 4) % 4 + 1;
  return { year: yearOut, quarter: quarterOut };
}

// =========================================================
// Plan synthesis
// =========================================================

/**
 * Build a quarter plan in memory from the latest available data.
 * Does NOT hit Perplexity — callers that want a freshly-pulled intel
 * feed should use `regenerateQuarterPlan` instead, which fans out to
 * fetchMarketIntel and persists the result.
 */
export async function buildQuarterPlan({ property, year, quarter }) {
  const window = getQuarterWindow(year, quarter);
  const market = property.market || property.slug;

  // Anchor events overlapping the quarter window
  const events = ANCHOR_EVENTS_SEED.filter(
    (e) =>
      e.market === market &&
      e.endDate >= window.startIso &&
      e.startDate < window.endExclusiveIso,
  ).sort((a, b) => a.startDate.localeCompare(b.startDate));

  // Premium booking windows derived from the events
  const baseAdr = property.baseAdrUsd ?? property.base_adr_usd ?? 600;
  const premiumWindows = events.map((e) => {
    const premium = calcEventPremium({
      baseAdrUsd: baseAdr,
      occupancyBaseline: 0.6,
      event: e,
      nights: e.minStayNights,
    });
    return {
      eventSlug: e.slug,
      label: e.name,
      startDate: e.startDate,
      endDate: e.endDate,
      adrUpliftPct: e.adrUpliftPct,
      recommendedAdr: premium?.recommendedAdr ?? null,
      recommendedMinStay: e.minStayNights,
      notes: e.notes,
    };
  });

  // Intel items from the DB feed, filtered to the quarter
  const intelItems = await loadIntelForQuarter({ market, window });

  // Top-line summary derived from intel + events (a real Perplexity-driven
  // "executive summary" is generated on regenerateQuarterPlan; here we
  // just compose a short deterministic one from what's already cached).
  const intelSummary = composeSummary({ events, intelItems });

  return {
    propertySlug: property.slug,
    market,
    year,
    quarter,
    window,
    events,
    premiumWindows,
    intelItems,
    intelSummary,
    generatedAt: new Date().toISOString(),
    source: 'cached', // 'cached' = built from intel_items DB rows; 'live' set by regenerate
  };
}

/**
 * Regenerate a plan with a fresh Perplexity fetch, then persist it
 * to marketing_quarterly_plans. Returns the rebuilt plan.
 *
 * `generatedBy` is the auth.user.id of the operator clicking Refresh,
 * or null in the legacy-cookie path.
 */
export async function regenerateQuarterPlan({ property, year, quarter, generatedBy = null }) {
  const market = property.market || property.slug;
  const meta = MARKETS[market];
  if (!meta) {
    throw new Error(`unknown market for property: ${market}`);
  }

  // Live Perplexity pull (cached for 1hr by fetchMarketIntel itself)
  const intel = await fetchMarketIntel({ market, marketLabel: meta.label });

  // Persist intel items into the database BEFORE we build the plan, so
  // buildQuarterPlan picks up the fresh rows.
  const supabase = getAdminClient();
  if (supabase && intel?.items?.length) {
    await supabase.from('intel_items').delete().eq('market', market);
    await supabase.from('intel_items').insert(
      intel.items.map((i) => ({
        market,
        title: i.title,
        category: i.category,
        expected_impact: i.expectedImpact,
        magnitude: i.magnitude,
        earliest_date: i.earliestDate,
        latest_date: i.latestDate,
        summary: i.summary,
        revenue_thesis: i.revenueThesis,
        source_title: i.sourceTitle,
        source_url: i.sourceUrl,
      })),
    );
  }

  const plan = await buildQuarterPlan({ property, year, quarter });
  // Use Perplexity's executive summary if available, otherwise our composed one
  if (intel?.summary) plan.intelSummary = intel.summary;
  plan.source = intel?.stub ? 'stub' : 'live';

  // Upsert the cache
  if (supabase) {
    await supabase
      .from('marketing_quarterly_plans')
      .upsert(
        {
          property_id: property.id || null,
          year,
          quarter,
          intel_summary: { text: plan.intelSummary, items: plan.intelItems },
          premium_windows: plan.premiumWindows,
          comp_set_snapshot: null,
          generated_at: new Date().toISOString(),
          generated_by: generatedBy,
        },
        { onConflict: 'property_id,year,quarter' },
      );
  }

  return plan;
}

/**
 * Load a previously-saved plan, if one exists and isn't stale.
 * Returns null if missing or older than `staleAfterDays` (default 7d).
 */
export async function loadCachedQuarterPlan({ property, year, quarter, staleAfterDays = 7 }) {
  const supabase = getAdminClient();
  if (!supabase || !property.id) return null;

  const { data, error } = await supabase
    .from('marketing_quarterly_plans')
    .select('id, year, quarter, intel_summary, premium_windows, generated_at')
    .eq('property_id', property.id)
    .eq('year', year)
    .eq('quarter', quarter)
    .maybeSingle();

  if (error || !data) return null;

  const ageMs = Date.now() - new Date(data.generated_at).getTime();
  if (ageMs > staleAfterDays * 86_400_000) {
    return { ...data, stale: true };
  }
  return { ...data, stale: false };
}

// =========================================================
// Internals
// =========================================================

async function loadIntelForQuarter({ market, window }) {
  const supabase = getAdminClient();
  if (!supabase) return [];

  const { data, error } = await supabase
    .from('intel_items')
    .select('*')
    .eq('market', market);

  if (error || !data) return [];

  // Filter to items whose declared window overlaps the quarter. Intel
  // dates are stored as YYYY-MM strings; null/missing has semantics:
  //   - earliest=null              → ongoing/indefinite, include everywhere
  //   - earliest set, latest=null  → "starts then; ongoing indefinitely"
  //                                  treat latest as far-future so it
  //                                  appears in every quarter from earliest
  //                                  onward, not just the earliest month.
  return data
    .filter((it) => {
      const earliest = it.earliest_date;
      if (!earliest) return true;
      const earliestIso = earliest.length === 7 ? `${earliest}-01` : earliest;

      const latest = it.latest_date;
      const latestIso = latest
        ? latest.length === 7
          ? `${latest}-28`
          : latest
        : '9999-12-31';

      return latestIso >= window.startIso && earliestIso < window.endExclusiveIso;
    })
    .sort((a, b) => (a.earliest_date || '').localeCompare(b.earliest_date || ''));
}

function composeSummary({ events, intelItems }) {
  const eventCount = events.length;
  const positiveItems = intelItems.filter((i) => i.expected_impact === 'positive').length;
  const negativeItems = intelItems.filter((i) => i.expected_impact === 'negative').length;
  const highMagnitude = intelItems.filter((i) => i.magnitude === 'high').length;

  const parts = [];
  if (eventCount > 0) {
    parts.push(
      `${eventCount} anchor event${eventCount === 1 ? '' : 's'} in the quarter (${events
        .slice(0, 3)
        .map((e) => e.name)
        .join('; ')}${eventCount > 3 ? '…' : ''})`,
    );
  }
  if (positiveItems > 0 || negativeItems > 0) {
    parts.push(
      `${positiveItems} positive and ${negativeItems} negative market signal${
        positiveItems + negativeItems === 1 ? '' : 's'
      }${highMagnitude ? `, ${highMagnitude} high-magnitude` : ''}`,
    );
  }
  if (parts.length === 0) {
    return 'No anchor events or market signals on file for this quarter. Click "Refresh from Perplexity" to fetch the latest.';
  }
  return parts.join('. ') + '.';
}
