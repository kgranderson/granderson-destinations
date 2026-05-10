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
    // Network failure — fall through to stub so the dashboard renders.
    return { stub: true, error: String(err) };
  }
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    return { stub: true, error: `PriceLabs ${path} → ${res.status}: ${text.slice(0, 200)}` };
  }
  return res.json();
}

export async function listListings() {
  const live = await plFetch('/listings');
  if (live?.stub) {
    return [
      { listing_id: 'PL-PS-001', name: 'Casa del Sol — Palm Springs', currency: 'USD' },
      { listing_id: 'PL-SMA-001', name: 'Casa Talavera — San Miguel', currency: 'USD' },
    ];
  }
  return live?.listings ?? [];
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
