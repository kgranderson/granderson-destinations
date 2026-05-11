/**
 * Synthetic 24-month occupancy seed — mirrors the seasonality
 * curves in lib/economics/seed.js so the occupancy chart aligns
 * with the revenue chart.
 *
 * Returns one row per (property × month) with nights_booked,
 * nights_available, and realized ADR.
 */
import { addMonths, format } from 'date-fns';

const SEASONALITY = {
  'palm-springs': {
    occ: [1.05, 1.20, 1.30, 1.45, 0.95, 0.55, 0.45, 0.45, 0.65, 0.95, 1.05, 1.10],
    adr: [1.05, 1.15, 1.25, 1.55, 0.95, 0.65, 0.55, 0.55, 0.75, 0.95, 1.05, 1.10],
  },
  'san-miguel-de-allende': {
    occ: [0.85, 0.85, 0.95, 0.95, 0.85, 0.80, 0.85, 0.85, 0.95, 1.45, 1.05, 1.05],
    adr: [0.95, 0.95, 1.0, 1.0, 0.95, 0.90, 0.95, 0.95, 1.05, 1.40, 1.05, 1.05],
  },
};
const BASES = {
  'palm-springs': { occ: 0.66, adr: 720 },
  'san-miguel-de-allende': { occ: 0.62, adr: 410 },
};

function rand(seed) {
  let s = seed;
  return () => {
    s = (s * 9301 + 49297) % 233280;
    return s / 233280;
  };
}

export function generateOccupancySeed(propertySlug) {
  const seas = SEASONALITY[propertySlug];
  const base = BASES[propertySlug];
  if (!seas || !base) return [];

  const rng = rand(propertySlug.length * 7919);
  const today = new Date();
  const start = addMonths(new Date(today.getFullYear(), today.getMonth(), 1), -24);

  const out = [];
  for (let i = 0; i < 24; i++) {
    const d = addMonths(start, i);
    const month = format(d, 'yyyy-MM');
    const monthIdx = d.getMonth();
    const days = new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();

    const occ = Math.min(0.97, base.occ * seas.occ[monthIdx] * (0.94 + rng() * 0.12));
    const adr = base.adr * seas.adr[monthIdx] * (0.93 + rng() * 0.14);
    const nightsBooked = Math.round(days * occ);
    const revenue = Math.round(adr * nightsBooked);

    out.push({
      month,
      nights_booked: nightsBooked,
      nights_available: days,
      adr_realized: +adr.toFixed(2),
      revenue_realized: revenue,
      source: 'seed',
      occupancy: nightsBooked / days,
    });
  }
  return out;
}
