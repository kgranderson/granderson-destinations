/**
 * Synthetic 24-month financials seed for the economics dashboard.
 *
 * Replaces with Rent Manager-loaded data when wired. The seasonality
 * curves and expense ratios are calibrated to realistic ranges for a
 * top-quartile B-class luxury short-term rental in each market.
 *
 * One row = one (property × month × expense_category) tuple, plus
 * one row per (property × month) for the revenue side.
 */

import { addMonths, format } from 'date-fns';

// =============================================================
// Per-market seasonality (occupancy lift over the year, 1.0 = avg)
// =============================================================
const SEASONALITY = {
  'palm-springs': {
    // Jan, Feb, Mar, Apr (Coachella+Stagecoach), May, Jun, Jul, Aug, Sep, Oct, Nov, Dec
    occ: [1.05, 1.20, 1.30, 1.45, 0.95, 0.55, 0.45, 0.45, 0.65, 0.95, 1.05, 1.10],
    adrMultiplier: [1.05, 1.15, 1.25, 1.55, 0.95, 0.65, 0.55, 0.55, 0.75, 0.95, 1.05, 1.10],
  },
  'san-miguel-de-allende': {
    occ: [0.85, 0.85, 0.95, 0.95, 0.85, 0.80, 0.85, 0.85, 0.95, 1.45, 1.05, 1.05],
    adrMultiplier: [0.95, 0.95, 1.0, 1.0, 0.95, 0.90, 0.95, 0.95, 1.05, 1.40, 1.05, 1.05],
  },
};

// =============================================================
// Expense profile per market — % of gross revenue, calibrated
// =============================================================
const EXPENSE_RATIOS = {
  'palm-springs': {
    'Cleaning':              0.115,
    'Property management':   0.080,
    'Utilities':             0.055,
    'Pool & landscaping':    0.045,
    'Maintenance':           0.040,
    'Insurance':             0.025,
    'Property tax':          0.060,
    'Lodging tax remitted':  0.115,
    'Marketing & OTA fees':  0.090,
    'Supplies & restock':    0.022,
    'Concierge':             0.018,
  },
  'san-miguel-de-allende': {
    'Cleaning':              0.105,
    'Property management':   0.085,
    'Utilities':             0.040,
    'Gardener & courtyard':  0.030,
    'Maintenance':           0.035,
    'Insurance':             0.020,
    'Property tax':          0.025,
    'Lodging tax remitted':  0.080,
    'Marketing & OTA fees':  0.085,
    'Supplies & restock':    0.025,
    'Concierge':             0.022,
  },
};

// Inject a small handful of intentional anomalies so the outlier
// flagger has something to surface in the dashboard.
const ANOMALIES = [
  { propertySlug: 'palm-springs', month: '2025-07', category: 'Maintenance', multiplier: 4.2, note: 'AC compressor replacement' },
  { propertySlug: 'palm-springs', month: '2026-02', category: 'Pool & landscaping', multiplier: 3.0, note: 'Pool resurfacing project' },
  { propertySlug: 'san-miguel-de-allende', month: '2025-09', category: 'Maintenance', multiplier: 2.6, note: 'Roof terrace tile repair' },
  { propertySlug: 'san-miguel-de-allende', month: '2026-03', category: 'Marketing & OTA fees', multiplier: 1.85, note: 'Google Hotel Ads test' },
];

// =============================================================
// Generators
// =============================================================
const PROPERTIES = [
  { slug: 'palm-springs', baseAdr: 720, baseOcc: 0.66, sleeps: 8 },
  { slug: 'san-miguel-de-allende', baseAdr: 410, baseOcc: 0.62, sleeps: 8 },
];

// Seed RNG so the dashboard is deterministic across rebuilds.
function rand(seed) {
  let s = seed;
  return () => {
    s = (s * 9301 + 49297) % 233280;
    return s / 233280;
  };
}

export function generateFinancialsSeed() {
  const rows = [];
  const today = new Date();
  // 24 months ending last completed month
  const startMonth = addMonths(new Date(today.getFullYear(), today.getMonth(), 1), -24);

  for (const prop of PROPERTIES) {
    const rng = rand(prop.slug.length * 7919);
    const seasonality = SEASONALITY[prop.slug];
    const ratios = EXPENSE_RATIOS[prop.slug];

    for (let i = 0; i < 24; i++) {
      const monthDate = addMonths(startMonth, i);
      const month = format(monthDate, 'yyyy-MM');
      const monthIdx = monthDate.getMonth();

      // Revenue
      const occ = Math.min(0.97, prop.baseOcc * seasonality.occ[monthIdx] * (0.96 + rng() * 0.08));
      const adr = prop.baseAdr * seasonality.adrMultiplier[monthIdx] * (0.95 + rng() * 0.1);
      const days = new Date(monthDate.getFullYear(), monthDate.getMonth() + 1, 0).getDate();
      const grossRevenue = Math.round(adr * occ * days);

      rows.push({
        propertySlug: prop.slug,
        month,
        type: 'revenue',
        amount: grossRevenue,
        category: null,
        source: 'seed',
      });

      // Expenses
      for (const [category, ratio] of Object.entries(ratios)) {
        // Base expense + light noise
        let amount = Math.round(grossRevenue * ratio * (0.88 + rng() * 0.24));

        // Inject anomalies
        const anomaly = ANOMALIES.find(
          (a) => a.propertySlug === prop.slug && a.month === month && a.category === category,
        );
        if (anomaly) amount = Math.round(amount * anomaly.multiplier);

        rows.push({
          propertySlug: prop.slug,
          month,
          type: 'expense',
          amount,
          category,
          source: 'seed',
          note: anomaly?.note,
        });
      }
    }
  }

  return rows;
}

/**
 * Roll up seed rows into the shape lib/economics/model.js expects:
 * [{ month, revenue, expense, expenseCategory }]
 */
export function flattenSeedForRollup(seed, propertySlug) {
  const filtered = seed.filter((r) => r.propertySlug === propertySlug);
  return filtered.map((r) => ({
    month: r.month,
    revenue: r.type === 'revenue' ? r.amount : 0,
    expense: r.type === 'expense' ? r.amount : 0,
    expenseCategory: r.category,
  }));
}

// 12-month rolling baseline by category (for outlier comparisons).
export function categoryBaselines(seed, propertySlug) {
  const out = {};
  const slug = seed.filter((r) => r.propertySlug === propertySlug && r.type === 'expense');
  // Group by category, take avg of last 12 months ending one month before max.
  const byCategory = {};
  for (const r of slug) {
    (byCategory[r.category] = byCategory[r.category] || []).push(r);
  }
  for (const [cat, rows] of Object.entries(byCategory)) {
    const sorted = rows.sort((a, b) => a.month.localeCompare(b.month));
    const last12 = sorted.slice(-13, -1); // exclude most recent month
    out[cat] = last12.reduce((s, r) => s + r.amount, 0) / Math.max(1, last12.length);
  }
  return out;
}
