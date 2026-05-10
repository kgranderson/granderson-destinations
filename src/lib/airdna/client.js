import 'server-only';
/**
 * AirDNA MarketMinder client (Feature 6 — economic model comps).
 *
 * MarketMinder endpoints used:
 *   GET /market/{market_code}/summary
 *   GET /market/{market_code}/comp_set?bedrooms=...&accommodates=...
 *
 * Stub mode returns realistic, dialled-in values for Palm Springs
 * and San Miguel de Allende so the comp panel is fully populated
 * before the AirDNA Pro subscription is activated.
 */
import { FEATURE_FLAGS } from '@/lib/constants';

const BASE = process.env.AIRDNA_BASE_URL || 'https://api.airdna.co/v1';

async function adFetch(path) {
  if (!FEATURE_FLAGS.airdnaLive()) return { stub: true };
  const res = await fetch(`${BASE}${path}`, {
    headers: {
      Authorization: `Bearer ${process.env.AIRDNA_API_KEY}`,
      'X-Client-Id': process.env.AIRDNA_CLIENT_ID || '',
      'Content-Type': 'application/json',
    },
  });
  if (!res.ok) throw new Error(`AirDNA ${path} → ${res.status}`);
  return res.json();
}

export async function getMarketSummary(marketCode) {
  const live = await adFetch(`/market/${marketCode}/summary`);
  if (live?.stub) return stubMarketSummary(marketCode);
  return live;
}

export async function getCompSet({ marketCode, bedrooms, accommodates }) {
  const q = new URLSearchParams({
    bedrooms: String(bedrooms ?? ''),
    accommodates: String(accommodates ?? ''),
  });
  const live = await adFetch(`/market/${marketCode}/comp_set?${q}`);
  if (live?.stub) return stubCompSet(marketCode);
  return live;
}

// =============================================================
// Stubs
// =============================================================
function stubMarketSummary(marketCode) {
  if (marketCode.startsWith('palm-springs')) {
    return {
      stub: true,
      marketCode,
      adr: 462,
      occupancy: 0.61,
      revPar: 281.82,
      adrYoy: 0.038,
      occupancyYoy: -0.012,
      topQuartileAdr: 715,
      topQuartileRevPar: 472,
      activeListings: 4321,
      asOf: '2026-04-01',
    };
  }
  return {
    stub: true,
    marketCode,
    adr: 234,
    occupancy: 0.58,
    revPar: 135.72,
    adrYoy: 0.061,
    occupancyYoy: 0.022,
    topQuartileAdr: 388,
    topQuartileRevPar: 234,
    activeListings: 1820,
    asOf: '2026-04-01',
  };
}

function stubCompSet(marketCode) {
  const isPS = marketCode.startsWith('palm-springs');
  const seedAdr = isPS ? 720 : 405;
  const seedOcc = isPS ? 0.66 : 0.62;
  const comps = Array.from({ length: 12 }, (_, i) => {
    const jitter = (i * 17) % 11 - 5;
    return {
      listingId: `comp-${marketCode}-${i + 1}`,
      adr: Math.round(seedAdr * (0.85 + (i % 5) * 0.06) + jitter * 4),
      occupancy: +(seedOcc * (0.9 + (i % 7) * 0.025)).toFixed(3),
      revPar: 0,
      bedrooms: 3 + (i % 2),
      accommodates: 6 + (i % 3),
    };
  }).map((c) => ({ ...c, revPar: +(c.adr * c.occupancy).toFixed(2) }));
  return { stub: true, marketCode, comps, asOf: '2026-04-01' };
}
