/**
 * Lightweight formatting helpers. Intentionally dependency-free.
 */

export function usd(n, opts = {}) {
  return money(n, 'USD', opts);
}

/** Format an amount in any ISO currency, e.g. money(4500, 'MXN') → "MX$4,500". */
export function money(n, currency = 'USD', opts = {}) {
  if (n == null || Number.isNaN(n)) return '—';
  const code = String(currency || 'USD').toUpperCase();
  try {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: code,
      maximumFractionDigits: opts.fractionDigits ?? 0,
    }).format(n);
  } catch {
    // Unknown currency code — show the number with the raw code.
    return `${Math.round(n).toLocaleString('en-US')} ${code}`;
  }
}

export function pct(n, opts = {}) {
  if (n == null || Number.isNaN(n)) return '—';
  return new Intl.NumberFormat('en-US', {
    style: 'percent',
    maximumFractionDigits: opts.fractionDigits ?? 1,
  }).format(n);
}

export function compactNumber(n) {
  if (n == null) return '—';
  return new Intl.NumberFormat('en-US', { notation: 'compact', maximumFractionDigits: 1 }).format(n);
}

export function dateRange(start, end, locale = 'en-US') {
  if (!start || !end) return '';
  const a = new Date(start);
  const b = new Date(end);
  const fmt = new Intl.DateTimeFormat(locale, { month: 'short', day: 'numeric', year: 'numeric' });
  if (a.toDateString() === b.toDateString()) return fmt.format(a);
  return `${fmt.format(a)} – ${fmt.format(b)}`;
}

export function slugify(s) {
  return String(s)
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}
