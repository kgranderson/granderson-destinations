import 'server-only';
import { unstable_cache } from 'next/cache';
import { FEATURE_FLAGS } from '@/lib/constants';

/**
 * Google Places API (NEW) integration.
 *
 * Migration note: this used to call the LEGACY Places API at
 * maps.googleapis.com/maps/api/place/*. The new API at
 * places.googleapis.com/v1/* requires the X-Goog-Api-Key header
 * (not ?key=) and an X-Goog-FieldMask declaring which fields the
 * caller wants. The endpoint shapes are different too — Text Search
 * is POST with { textQuery }, not GET with ?query=.
 *
 * Cached aggressively (24h) — hotspot imagery changes rarely.
 */

const TEXTSEARCH = 'https://places.googleapis.com/v1/places:searchText';
const PLACE_DETAILS = (placeId) => `https://places.googleapis.com/v1/places/${placeId}`;
const PHOTO_BASE = 'https://places.googleapis.com/v1';

async function _findPlace({ query }) {
  if (!FEATURE_FLAGS.googlePlacesLive()) return { stub: true, placeId: null };
  let res;
  try {
    res = await fetch(TEXTSEARCH, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Goog-Api-Key': process.env.GOOGLE_PLACES_API_KEY,
        'X-Goog-FieldMask': 'places.id,places.displayName,places.formattedAddress',
      },
      body: JSON.stringify({ textQuery: query, pageSize: 1 }),
    });
  } catch (err) {
    return { stub: false, placeId: null, error: String(err) };
  }
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    return { stub: false, placeId: null, error: `${res.status}: ${text.slice(0, 200)}` };
  }
  const data = await res.json();
  const placeId = data.places?.[0]?.id ?? null;
  return { stub: false, placeId };
}

async function _getFirstPhotoRef({ placeId }) {
  if (!FEATURE_FLAGS.googlePlacesLive() || !placeId) {
    return { stub: true, photoReference: null };
  }
  let res;
  try {
    res = await fetch(PLACE_DETAILS(placeId), {
      headers: {
        'X-Goog-Api-Key': process.env.GOOGLE_PLACES_API_KEY,
        'X-Goog-FieldMask': 'displayName,formattedAddress,rating,userRatingCount,photos',
      },
    });
  } catch (err) {
    return { stub: false, photoReference: null, error: String(err) };
  }
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    return { stub: false, photoReference: null, error: `${res.status}: ${text.slice(0, 200)}` };
  }
  const data = await res.json();
  // Place Photos API (New) returns photo references as
  // `places/{place_id}/photos/{photo_id}`. We need the FULL name.
  const photoName = data.photos?.[0]?.name ?? null;
  return {
    stub: false,
    photoReference: photoName,
    rating: data.rating,
    ratingCount: data.userRatingCount,
  };
}

export const findPlace = unstable_cache(_findPlace, ['places-find-v1'], {
  revalidate: 86400,
  tags: ['places'],
});

export const getFirstPhotoRef = unstable_cache(_getFirstPhotoRef, ['places-photo-ref-v1'], {
  revalidate: 86400,
  tags: ['places'],
});

/**
 * Build the public photo URL. The actual fetch goes through
 * /api/places/photo so the API key never reaches the client.
 */
export function buildPhotoProxyUrl(photoName, { maxWidth = 1200 } = {}) {
  if (!photoName) return null;
  return `/api/places/photo?name=${encodeURIComponent(photoName)}&w=${maxWidth}`;
}

/**
 * One-shot: query → place_id → photo name → proxy URL.
 */
export async function lookupPhotoUrl({ query, maxWidth }) {
  const { placeId } = await findPlace({ query });
  if (!placeId) return null;
  const { photoReference } = await getFirstPhotoRef({ placeId });
  return buildPhotoProxyUrl(photoReference, { maxWidth });
}
