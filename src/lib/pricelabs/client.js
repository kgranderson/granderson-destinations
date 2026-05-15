import 'server-only';
/**
 * PriceLabs client (Feature 5 — dynamic pricing backend).
 *
 * Endpoints used:
 *   GET  /listings
 *   GET  /listing_prices?listing_id=...
 *   POST /price_overrides   (push event-driven uplifts)
 *
 * In stub mode returns deterministic mock data so the UI is fully
 * usable while keys are provisioned.
 */
import { FEATURE_FLAGS } from '@/lib/constants';

const DEFAULT_BASE = process.env.PRICELABS_BASE_URL || 'https://api.pricelabs.co/v1';

/**
 * Three response shapes — callers must distinguish:
 *   { stub: true }           → intentional stub mode (no API key configured)
 *   { failed: true, error }  → live mode, real failure (network or non-2xx)
 *   { ...realPayload }       → success
 *
 * Until 2026-05-15 this returned `{ stub: true, error }` for BOTH "no key"
 * and "API failed", which meant /admin/marketing's pricing cockpit showed
 * a success toast on a real PriceLabs rejection. Failures now surface
 * as `failed: true` so the cockpit can render an actual error to the operator.
 */
async function plFetch(path, init = {}) {
  if (!FEATURE_FLAGS.pricelabsLive()) {
    return { stub: true };
  }
  let res;
  try {
    res = await fetch(`${DEFAULT_BASE}${path}`, {
      ...init,
      headers: {
        'X-API-Key': process.env.PRICELABS_API_KEY,
        'Content-Type': 'application/json',
        ...(init.headers || {}),
      },
    });
  } catch (err) {
    return { failed: true, error: `PriceLabs ${path} network error: ${String(err)}` };
  }
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    return {
      failed: true,
      status: res.status,
      error: `PriceLabs ${path} → ${res.status}: ${text.slice(0, 200)}`,
    };
  }
  return res.json();
}

/**
 * Returns `{ listings, source, failed?, error? }` so callers can
 * distinguish three states:
 *   source: 'stub'   — no API key, deterministic mock data returned
 *   source: 'live'   — API succeeded
 *   failed: true     — API live but rejected/timed out; listings is []
 *
 * Until 2026-05-15 this returned a bare array, which made an upstream
 * outage indistinguishable from "PriceLabs has zero listings." The
 * /api/pricing/push-overrides route's listingId cross-validation was
 * silently 400-ing valid push attempts during PriceLabs outages.
 */
export async function listListings() {
  const live = await plFetch('/listings');
  if (live?.stub) {
    return {
      source: 'stub',
      listings: [
        { listing_id: 'PL-PS-001', name: 'The Sunbath House — Palm Springs', currency: 'USD' },
        { listing_id: 'PL-SMA-001', name: 'Casa Talavera — San Miguel', currency: 'USD' },
      ],
    };
  }
  if (live?.failed) {
    return {
      source: 'live',
      failed: true,
      error: live.error,
      status: live.status,
      listings: [],
    };
  }
  return { source: 'live', listings: live?.listings ?? [] };
}

export async function getRecommendedPrices({ listingId, days = 365 }) {
  const live = await plFetch(`/listing_prices?listing_id=${encodeURIComponent(listingId)}&days=${days}`);
  if (live?.stub) {
    const today = new Date();
    return Array.from({ length: days }, (_, i) => {
      const d = new Date(today);
      d.setDate(today.getDate() + i);
      const dow = d.getDay();
      const weekend = dow === 5 || dow === 6;
      const base = listingId.includes('PS') ? 720 : 410;
      const noise = ((d.getDate() * 13) % 11) - 5;
      const price = Math.round((weekend ? base * 1.35 : base) + noise);
      return {
        date: d.toISOString().slice(0, 10),
        price,
        currency: 'USD',
        source: 'stub',
        minStay: weekend ? 2 : 1,
      };
    });
  }
  return live?.prices ?? [];
}

export async function pushPriceOverrides({ listingId, overrides }) {
  return plFetch('/price_overrides', {
    method: 'POST',
    body: JSON.stringify({ listing_id: listingId, overrides }),
  });
}
