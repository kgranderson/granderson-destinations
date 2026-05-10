import 'server-only';
import { unstable_cache } from 'next/cache';
import { FEATURE_FLAGS } from '@/lib/constants';

/**
 * Google Places integration. We only need two operations:
 *   1. findPlace(query, locationBias) → place_id (used to anchor results)
 *   2. getFirstPhotoUrl(place_id, maxWidth) → fully-formed photo URL
 *
 * Cached aggressively (24h) — hotspot imagery changes rarely.
 */

const TEXTSEARCH = 'https://maps.googleapis.com/maps/api/place/textsearch/json';
const DETAILS = 'https://maps.googleapis.com/maps/api/place/details/json';
const PHOTO = 'https://maps.googleapis.com/maps/api/place/photo';

async function _findPlace({ query, locationBias }) {
  if (!FEATURE_FLAGS.googlePlacesLive()) return { stub: true, placeId: null };
  const params = new URLSearchParams({
    query,
    key: process.env.GOOGLE_PLACES_API_KEY,
    fields: 'place_id,name',
  });
  if (locationBias) params.set('location', locationBias);
  const res = await fetch(`${TEXTSEARCH}?${params}`);
  if (!res.ok) return { stub: false, placeId: null, error: `${res.status}` };
  const data = await res.json();
  const placeId = data.results?.[0]?.place_id ?? null;
  return { stub: false, placeId };
}

async function _getFirstPhotoRef({ placeId }) {
  if (!FEATURE_FLAGS.googlePlacesLive() || !placeId) {
    return { stub: true, photoReference: null };
  }
  const params = new URLSearchParams({
    place_id: placeId,
    key: process.env.GOOGLE_PLACES_API_KEY,
    fields: 'photos,name,formatted_address,rating,user_ratings_total',
  });
  const res = await fetch(`${DETAILS}?${params}`);
  if (!res.ok) return { stub: false, photoReference: null, error: `${res.status}` };
  const data = await res.json();
  const photoReference = data.result?.photos?.[0]?.photo_reference ?? null;
  return {
    stub: false,
    photoReference,
    rating: data.result?.rating,
    ratingCount: data.result?.user_ratings_total,
  };
}

export const findPlace = unstable_cache(_findPlace, ['places-find'], {
  revalidate: 86400,
  tags: ['places'],
});

export const getFirstPhotoRef = unstable_cache(_getFirstPhotoRef, ['places-photo-ref'], {
  revalidate: 86400,
  tags: ['places'],
});

/**
 * Build the public photo URL. Note: Google's photo endpoint returns
 * a 302 redirect to a googleusercontent.com URL — we proxy the
 * reference back through our /api/places/photo handler so we don't
 * leak the API key in img src.
 */
export function buildPhotoProxyUrl(photoReference, { maxWidth = 1200 } = {}) {
  if (!photoReference) return null;
  return `/api/places/photo?ref=${encodeURIComponent(photoReference)}&w=${maxWidth}`;
}

/**
 * One-shot: query → place_id → photo reference → proxy URL.
 * Returns null if anything fails or stub mode is active.
 */
export async function lookupPhotoUrl({ query, locationBias, maxWidth }) {
  const { placeId } = await findPlace({ query, locationBias });
  if (!placeId) return null;
  const { photoReference } = await getFirstPhotoRef({ placeId });
  return buildPhotoProxyUrl(photoReference, { maxWidth });
}
