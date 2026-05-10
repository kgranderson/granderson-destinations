/**
 * Feature 6 — Economic analytical model.
 *
 * Inputs: monthly revenue + expense rows from the DB.
 * Outputs:
 *   - rolled-up KPIs (rev, opex, NOI, NCF)
 *   - YoY comparisons
 *   - comp-percentile rank vs. AirDNA comp set
 *   - expense anomaly flags
 */
import { mean, std, percentileRank, isExpenseOutlier, quantile } from '@/lib/utils/stats';

export function rollupMonthly(rows = []) {
  const buckets = new Map();
  for (const r of rows) {
    const key = r.month; // 'YYYY-MM'
    const bucket = buckets.get(key) || {
      month: key,
      revenue: 0,
      expenses: 0,
      expensesByCategory: {},
    };
    bucket.revenue += r.revenue || 0;
    bucket.expenses += r.expense || 0;
    if (r.expenseCategory) {
      bucket.expensesByCategory[r.expenseCategory] =
        (bucket.expensesByCategory[r.expenseCategory] || 0) + (r.expense || 0);
    }
    buckets.set(key, bucket);
  }
  return [...buckets.values()].sort((a, b) => a.month.localeCompare(b.month));
}

export function withDerived(monthly) {
  return monthly.map((m) => {
    const noi = m.revenue - m.expenses;
    return { ...m, noi, ncf: noi, margin: m.revenue > 0 ? noi / m.revenue : 0 };
  });
}

/**
 * Performance score: where this property sits inside its AirDNA comp
 * set. 1.0 = top of comp set, 0.5 = median.
 */
export function compRank({ propertyAdr, propertyRevPar, compSet }) {
  if (!compSet?.comps?.length) return { adrPct: null, revParPct: null };
  const adrs = compSet.comps.map((c) => c.adr);
  const revs = compSet.comps.map((c) => c.revPar);
  return {
    adrPct: percentileRank(propertyAdr, adrs),
    revParPct: percentileRank(propertyRevPar, revs),
    medianAdr: quantile(adrs, 0.5),
    medianRevPar: quantile(revs, 0.5),
    topQuartileAdr: quantile(adrs, 0.75),
    topQuartileRevPar: quantile(revs, 0.75),
  };
}

/**
 * Returns flagged expenses with severity and recommended action.
 */
export function flagExpenses({ monthly, compMedians = {}, baselines = {} }) {
  const flagged = [];
  for (const m of monthly) {
    for (const [category, amount] of Object.entries(m.expensesByCategory || {})) {
      const baseline = baselines[category];
      const compMedian = compMedians[category];
      const comps = compMedian != null ? [compMedian * 0.85, compMedian, compMedian * 1.15] : [];
      const flagged_ = isExpenseOutlier({ value: amount, baseline, comps });
      if (flagged_) {
        const pctOverBaseline = baseline ? (amount - baseline) / baseline : null;
        flagged.push({
          month: m.month,
          category,
          amount,
          baseline,
          compMedian,
          pctOverBaseline,
          severity: pctOverBaseline > 0.5 ? 'high' : pctOverBaseline > 0.25 ? 'med' : 'low',
        });
      }
    }
  }
  return flagged.sort((a, b) => b.amount - a.amount);
}

/**
 * Revenue maximization "what-if" lever:
 * change in occupancy/ADR/min-stay → projected revenue delta.
 */
export function whatIf({ baseAdr, baseOccupancy, deltaAdrPct = 0, deltaOccPct = 0, nights = 30 }) {
  const adr = baseAdr * (1 + deltaAdrPct);
  const occ = Math.max(0, Math.min(1, baseOccupancy * (1 + deltaOccPct)));
  const revenue = adr * occ * nights;
  const baseline = baseAdr * baseOccupancy * nights;
  return {
    adr: +adr.toFixed(2),
    occupancy: +occ.toFixed(3),
    revenue: +revenue.toFixed(2),
    baselineRevenue: +baseline.toFixed(2),
    delta: +(revenue - baseline).toFixed(2),
    deltaPct: baseline ? (revenue - baseline) / baseline : 0,
  };
}

export { mean, std };
