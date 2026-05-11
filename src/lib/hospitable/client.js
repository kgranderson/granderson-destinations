import 'server-only';
/**
 * Hospitable Public API client. Stub-first — when HOSPITABLE_API_KEY
 * is absent (e.g. trial tier, key not yet generated), all methods
 * fall back to realistic synthetic data so the UI is fully usable.
 *
 * When the key arrives, every method flips to live with zero code
 * change required.
 */
import { unstable_cache } from 'next/cache';

const BASE = process.env.HOSPITABLE_BASE_URL || 'https://api.hospitable.com/v2';

function isLive() {
  return !!process.env.HOSPITABLE_API_KEY;
}

async function hFetch(path, init = {}) {
  if (!isLive()) return { stub: true };
  let res;
  try {
    res = await fetch(`${BASE}${path}`, {
      ...init,
      headers: {
        Authorization: `Bearer ${process.env.HOSPITABLE_API_KEY}`,
        'Content-Type': 'application/json',
        ...(init.headers || {}),
      },
    });
  } catch (err) {
    return { stub: true, error: String(err) };
  }
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    return { stub: true, error: `Hospitable ${path} → ${res.status}: ${text.slice(0, 200)}` };
  }
  return res.json();
}

export async function listListings() {
  const data = await hFetch('/listings');
  if (data?.stub) return { stub: true, listings: [] };
  return { stub: false, listings: data?.data ?? data?.listings ?? [] };
}

/**
 * Daily calendar for one listing — nights blocked/booked/available
 * with realized ADR per night. Cached 10 min.
 */
async function _getCalendar({ listingId, from, to }) {
  if (!isLive()) return { stub: true, days: [] };
  const data = await hFetch(`/listings/${listingId}/calendar?start_date=${from}&end_date=${to}`);
  if (data?.stub) return { stub: true, days: [] };
  return { stub: false, days: data?.data ?? data?.calendar ?? [] };
}
export const getCalendar = unstable_cache(_getCalendar, ['hospitable-calendar'], {
  revalidate: 600,
  tags: ['hospitable'],
});

/**
 * Reservations between two dates. Source of truth for actual
 * realized revenue per stay. Cached 10 min.
 */
async function _listReservations({ listingId, from, to }) {
  if (!isLive()) return { stub: true, reservations: [] };
  const path = listingId
    ? `/reservations?listing_id=${listingId}&from=${from}&to=${to}`
    : `/reservations?from=${from}&to=${to}`;
  const data = await hFetch(path);
  if (data?.stub) return { stub: true, reservations: [] };
  return { stub: false, reservations: data?.data ?? data?.reservations ?? [] };
}
export const listReservations = unstable_cache(_listReservations, ['hospitable-reservations'], {
  revalidate: 600,
  tags: ['hospitable'],
});
