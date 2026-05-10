import 'server-only';
/**
 * Server-side helpers for hotspots. Pulls from seed data today,
 * upgrades to Google Places + Supabase when keys are configured.
 */
import { FEATURE_FLAGS, MARKETS } from '@/lib/constants';
import { HOTSPOTS } from './data';
import { getPublicReadClient } from '@/lib/supabase/server';
import { lookupPhotoUrl } from '@/lib/google/places';

/**
 * Enrich hotspots with Google Place Photos for any item missing
 * an image. Cached aggressively (24h) by the underlying lookup.
 */
async function enrichWithPlacePhotos(items, market) {
  if (!FEATURE_FLAGS.googlePlacesLive()) return items;
  const m = MARKETS[market];
  // Use the market's Google Place ID center as a location bias if available,
  // otherwise fall back to plain text search using city + name.
  return Promise.all(
    items.map(async (h) => {
      if (h.image) return h; // already has a working image
      try {
        const url = await lookupPhotoUrl({
          query: `${h.name} ${h.neighborhood || ''} ${m?.label || market}`.trim(),
          maxWidth: 1200,
        });
        return url ? { ...h, image: url } : h;
      } catch {
        return h;
      }
    }),
  );
}

export async function listHotspots(market, { category, limit } = {}) {
  // 1. Try Supabase first (if hotspots table is populated)
  const supabase = getPublicReadClient();
  if (supabase) {
    let q = supabase.from('hotspots').select('*').eq('market', market);
    if (category) q = q.eq('category', category);
    if (limit) q = q.limit(limit);
    const { data, error } = await q;
    if (!error && data?.length) {
      const enriched = await enrichWithPlacePhotos(data, market);
      return { stub: false, items: enriched };
    }
  }

  // 2. Fall back to curated seed data
  const seed = HOTSPOTS[market] ?? [];
  const filtered = category ? seed.filter((h) => h.category === category) : seed;
  const sliced = limit ? filtered.slice(0, limit) : filtered;
  const enriched = await enrichWithPlacePhotos(sliced, market);
  return {
    stub: !FEATURE_FLAGS.googlePlacesLive(),
    items: enriched,
  };
}

/**
 * Top N featured hotspots — used by the property page section.
 */
export async function listFeaturedHotspots(market, n = 4) {
  const { items, stub } = await listHotspots(market);
  const featured = items.filter((h) => h.featured);
  return { stub, items: (featured.length ? featured : items).slice(0, n) };
}
