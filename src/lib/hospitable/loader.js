import 'server-only';
import { unstable_cache } from 'next/cache';
import { getAdminClient } from '@/lib/supabase/admin';
import { generateOccupancySeed } from './seed';

/**
 * Returns 24 months of occupancy for one property. Prefers
 * Supabase's occupancy_records table; falls back to synthetic
 * seed so the UI always renders.
 */
async function _loadOccupancy(propertySlug) {
  const supabase = getAdminClient();
  if (supabase) {
    const { data: prop } = await supabase
      .from('properties')
      .select('id')
      .eq('slug', propertySlug)
      .maybeSingle();

    if (prop?.id) {
      const { data, error } = await supabase
        .from('occupancy_records')
        .select('month, nights_booked, nights_available, adr_realized, revenue_realized, source')
        .eq('property_id', prop.id)
        .order('month', { ascending: true });

      if (!error && data?.length) {
        const rows = data.map((r) => ({
          ...r,
          occupancy: r.nights_available > 0 ? r.nights_booked / r.nights_available : 0,
        }));
        return { stub: false, rows };
      }
    }
  }
  return { stub: true, rows: generateOccupancySeed(propertySlug) };
}

export function loadOccupancy(propertySlug) {
  return unstable_cache(
    () => _loadOccupancy(propertySlug),
    ['occupancy', propertySlug],
    { revalidate: 600, tags: ['occupancy', `occupancy:${propertySlug}`] },
  )();
}
