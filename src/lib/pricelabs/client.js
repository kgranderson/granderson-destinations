import { boundedFetch } from '@/lib/http.mjs';
import 'server-only';
/**
 * PriceLabs Customer API client (Feature 5 — dynamic pricing backend).
 *
 * Endpoints used (https://developers.pricelabs.co, OpenAPI "customer-api"):
 *   GET  /v1/listings            → { listings: [{ id, pms, name, currency, ... }] }
 *   POST /v1/listing_prices      body { listings: [{ id, pms, dateFrom, dateTo }] }
 *                                → [{ id, pms, currency, data: [{ date, price, min_stay, ... }] }]
 *
 * Every listing-specific call needs BOTH the listing id and its PMS name
 * ("airbnb", "hostaway", ...). Callers only store the id; the PMS is
 * resolved from /v1/listings when it isn't passed in.
 *
 * Rate limits (per PriceLabs docs): 10 calls / account / minute.
 * A cockpit page view costs 2 calls (listings + listing_prices).
 *
 * In stub mode (no PRICELABS_API_KEY) returns deterministic mock data so
 * the UI is fully usable while keys are provisioned.
 */
import { FEATURE_FLAGS, PROPERTIES, MARKETS } from '@/lib/constants';

const DEFAULT_BASE = process.env.PRICELABS_BASE_URL || 'https://api.pricelabs.co/v1';

// Short per-instance cache for successful reads. PriceLabs allows 10
// calls per account per minute and only refreshes prices daily, so
// re-fetching on every page view buys nothing and risks 429s.
const CACHE_TTL_MS = 60_000;
const cache = new Map();
function cacheGet(key) {
  const hit = cache.get(key);
  if (!hit) return undefined;
  if (Date.now() - hit.at > CACHE_TTL_MS) {
    cache.delete(key);
    return undefined;
  }
  return hit.value;
}
function cacheSet(key, value) {
  cache.set(key, { at: Date.now(), value });
}

/**
 * Three response shapes — callers must distinguish:
 *   { stub: true }           → intentional stub mode (no API key configured)
 *   { failed: true, error }  → live mode, real failure (network or non-2xx)
 *   { ...realPayload }       → success
 */
async function plFetch(path, init = {}) {
  if (!FEATURE_FLAGS.pricelabsLive()) {
    return { stub: true };
  }
  let res;
  try {
    res = await boundedFetch(`${DEFAULT_BASE}${path}`, {
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
    return {
      failed: true,
      status: res.status,
      error: `PriceLabs ${path} → ${res.status}: request_failed`,
    };
  }
  try {
    return await res.json();
  } catch {
    return { failed: true, status: res.status, error: `PriceLabs ${path}: invalid JSON` };
  }
}

/**
 * PriceLabs returns `id`; older callers read `listing_id`. Expose both
 * (as strings) so ids compare reliably against configured values.
 */
function normalizeListing(l) {
  const id = l?.id == null ? '' : String(l.id);
  return {
    ...l,
    id,
    listing_id: id,
    pms: l?.pms ?? null,
    name: l?.name ?? '',
    currency: l?.currency ?? null,
  };
}

/**
 * Returns `{ listings, source, failed?, error? }` so callers can
 * distinguish three states:
 *   source: 'stub'   — no API key, deterministic mock data returned
 *   source: 'live'   — API succeeded
 *   failed: true     — API live but rejected/timed out; listings is []
 */
export async function listListings() {
  const cached = FEATURE_FLAGS.pricelabsLive() ? cacheGet('listings') : undefined;
  if (cached) return cached;
  const live = await plFetch('/listings');
  if (live?.stub) {
    // Mirror the configured property → listing mapping so stub mode
    // exercises the same id-based matching as live mode.
    return {
      source: 'stub',
      listings: PROPERTIES.filter((p) => p.pricelabsListingId).map((p) =>
        normalizeListing({ id: p.pricelabsListingId, pms: 'stub', name: p.name, currency: 'USD' }),
      ),
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
  const raw = Array.isArray(live?.listings) ? live.listings : [];
  const result = { source: 'live', listings: raw.map(normalizeListing) };
  cacheSet('listings', result);
  return result;
}

/** Find one listing by id. Returns { listing, failed?, error? }. */
export async function findListing(listingId) {
  const result = await listListings();
  if (result.failed) return { listing: null, failed: true, error: result.error };
  const id = String(listingId ?? '');
  return { listing: result.listings.find((l) => l.id === id) || null };
}

function isoDay(d) {
  return d.toISOString().slice(0, 10);
}

/** Today's date (YYYY-MM-DD) in the given IANA time zone. */
function localToday(timeZone) {
  try {
    return new Intl.DateTimeFormat('en-CA', {
      timeZone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).format(new Date());
  } catch {
    return isoDay(new Date());
  }
}

/** Add whole days to a YYYY-MM-DD string (calendar math in UTC). */
function addDaysIso(dayIso, n) {
  const d = new Date(`${dayIso}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + n);
  return isoDay(d);
}

/** Time zone of the property linked to a PriceLabs listing id. */
function timeZoneForListing(listingId) {
  const prop = PROPERTIES.find((p) => String(p.pricelabsListingId) === String(listingId));
  return (prop && MARKETS[prop.slug]?.timeZone) || 'America/Los_Angeles';
}

/**
 * Recommended nightly prices for one listing, starting today in the
 * property's own time zone.
 * Returns an array of { date, price, currency, minStay, source, ... }
 * ([] when PriceLabs has no data or the call fails — failures are logged).
 * `currency` on each row is null if neither PriceLabs nor the caller's
 * hint knows it — never silently assumed to be USD in live mode.
 *
 * Pass `pms` (and ideally `currency`) when the caller already has the
 * listing from listListings() — saves a /v1/listings call.
 */
export async function getRecommendedPrices({ listingId, pms, currency: currencyHint, timeZone, days = 365 }) {
  if (!FEATURE_FLAGS.pricelabsLive()) {
    const today = new Date();
    const prop = PROPERTIES.find((p) => String(p.pricelabsListingId) === String(listingId));
    const base = prop?.baseAdrUsd ?? 600;
    return Array.from({ length: days }, (_, i) => {
      const d = new Date(today);
      d.setDate(today.getDate() + i);
      const dow = d.getDay();
      const weekend = dow === 5 || dow === 6;
      const noise = ((d.getDate() * 13) % 11) - 5;
      const price = Math.round((weekend ? base * 1.35 : base) + noise);
      return {
        date: isoDay(d),
        price,
        currency: 'USD',
        source: 'stub',
        minStay: weekend ? 2 : 1,
      };
    });
  }

  const id = String(listingId ?? '');
  if (!id) return [];

  let resolvedPms = pms;
  let listingCurrency = null;
  if (!resolvedPms) {
    const { listing, failed, error } = await findListing(id);
    if (failed || !listing) {
      console.warn('[pricelabs] listing lookup failed', { listingId: id, error: error || 'not_found' });
      return [];
    }
    resolvedPms = listing.pms;
    listingCurrency = listing.currency;
  }

  const span = Math.max(1, days);
  const dateFrom = localToday(timeZone || timeZoneForListing(id));
  const dateTo = addDaysIso(dateFrom, span - 1);

  const cacheKey = `prices:${id}:${resolvedPms}:${dateFrom}:${span}`;
  let live = cacheGet(cacheKey);
  if (!live) {
    live = await plFetch('/listing_prices', {
      method: 'POST',
      body: JSON.stringify({ listings: [{ id, pms: resolvedPms, dateFrom, dateTo }] }),
    });
    if (live?.failed) {
      console.warn('[pricelabs] listing_prices failed', { listingId: id, status: live.status });
      return [];
    }
    if (Array.isArray(live)) cacheSet(cacheKey, live);
  }

  const items = Array.isArray(live) ? live : [];
  const item = items.find((x) => String(x?.id) === id) || null;
  if (!item || item.error) {
    console.warn('[pricelabs] listing_prices returned no data', {
      listingId: id,
      error_status: item?.error_status || (item ? 'error' : 'missing'),
    });
    return [];
  }

  const currency = item.currency || currencyHint || listingCurrency || null;
  return (Array.isArray(item.data) ? item.data : [])
    .filter(
      (d) =>
        typeof d?.date === 'string' &&
        d.date >= dateFrom &&
        Number.isFinite(Number(d.price)) &&
        Number(d.price) > 0,
    )
    .map((d) => ({
      date: d.date,
      price: Number(d.price),
      currency,
      minStay: Number(d.min_stay) > 0 ? Number(d.min_stay) : 1,
      // user_price is the last price seen on the PMS; -1 means unavailable/blocked.
      userPrice: Number.isFinite(Number(d.user_price)) ? Number(d.user_price) : null,
      unavailable: Number(d.user_price) === -1,
      demand: d.demand_desc ?? null,
      source: 'live',
    }))
    .slice(0, days);
}

/**
 * Pushing date-specific overrides is intentionally OFF until the
 * override mapping (per-date entries, price_type, currency per listing,
 * parent/child propagation) is reviewed — this call changes the prices
 * guests see on live listings. The previous implementation POSTed to
 * /price_overrides, which does not exist in the PriceLabs API.
 */
export async function pushPriceOverrides() {
  if (!FEATURE_FLAGS.pricelabsLive()) {
    return { stub: true };
  }
  return {
    failed: true,
    error: 'Pushing to PriceLabs is turned off until the override format is reviewed.',
  };
}
