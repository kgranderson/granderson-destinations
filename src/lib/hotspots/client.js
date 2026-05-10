import 'server-only';
/**
 * Server-side helpers for hotspots. Pulls from seed data today,
 * upgrades to Google Places + Supabase when keys are configured.
 */
import { FEATURE_FLAGS } from '@/lib/constants';
import { HOTSPOTS } from './data';
import { getPublicReadClient } from '@/lib/supabase/server';

export async function listHotspots(market, { category, limit } = {}) {
  // 1. Try Supabase first (if hotspots table is populated)
  const supabase = getPublicReadClient();
  if (supabase) {
    let q = supabase.from('hotspots').select('*').eq('market', market);
    if (category) q = q.eq('category', category);
    if (limit) q = q.limit(limit);
    const { data, error } = await q;
    if (!error && data?.length) return { stub: false, items: data };
  }

  // 2. Fall back to curated seed data
  const seed = HOTSPOTS[market] ?? [];
  const filtered = category ? seed.filter((h) => h.category === category) : seed;
  return {
    stub: !FEATURE_FLAGS.googlePlacesLive(),
    items: limit ? filtered.slice(0, limit) : filtered,
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
