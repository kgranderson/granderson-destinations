/**
 * Tiny stats helpers for the economics module (Feature 6).
 */

export function mean(arr) {
  if (!arr || arr.length === 0) return 0;
  return arr.reduce((a, b) => a + b, 0) / arr.length;
}

export function std(arr) {
  if (!arr || arr.length < 2) return 0;
  const m = mean(arr);
  const variance = arr.reduce((acc, x) => acc + (x - m) ** 2, 0) / (arr.length - 1);
  return Math.sqrt(variance);
}

export function quantile(arr, q) {
  if (!arr || arr.length === 0) return 0;
  const sorted = [...arr].sort((a, b) => a - b);
  const pos = (sorted.length - 1) * q;
  const base = Math.floor(pos);
  const rest = pos - base;
  if (sorted[base + 1] != null) return sorted[base] + rest * (sorted[base + 1] - sorted[base]);
  return sorted[base];
}

/**
 * Returns the percentile rank (0–1) of value within the comp set.
 */
export function percentileRank(value, comps) {
  if (!comps || comps.length === 0) return null;
  const below = comps.filter((c) => c < value).length;
  return below / comps.length;
}

/**
 * Flags an expense as an outlier if it's more than `nSigma` standard
 * deviations above the rolling baseline, or > pctAboveBaseline above
 * the comp-set median, whichever is stricter.
 */
export function isExpenseOutlier({ value, baseline, comps, nSigma = 1.5, pctAboveBaseline = 0.2 }) {
  if (value == null || baseline == null) return false;
  const compsArr = comps || [];
  const sigma = std(compsArr);
  const median = quantile(compsArr, 0.5);
  const sigmaFlag = sigma > 0 && value > median + nSigma * sigma;
  const pctFlag = baseline > 0 && (value - baseline) / baseline > pctAboveBaseline;
  return sigmaFlag || pctFlag;
}
