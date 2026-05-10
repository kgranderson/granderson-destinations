/**
 * Photo library — wraps the per-property gallery from constants.js
 * and adds metadata (tags, last-posted) so the cadence engine can
 * avoid re-posting the same shot too quickly.
 *
 * In a future milestone this is backed by Supabase Storage with
 * EXIF + AI-tagged metadata. For now: deterministic from PROPERTIES.
 */
import { PROPERTIES } from '@/lib/constants';

export function listPhotosForProperty(slug) {
  const p = PROPERTIES.find((x) => x.slug === slug);
  if (!p?.gallery) return [];
  return p.gallery.map((src, i) => ({
    id: `${slug}-photo-${i}`,
    src,
    propertySlug: slug,
    // Cheap heuristic for theming until real EXIF/AI-tags are added
    suggestedTheme: guessTheme(src),
    lastPostedAt: null,
  }));
}

function guessTheme(src) {
  const s = src.toLowerCase();
  if (s.includes('pool') || s.includes('poolside')) return 'pool-or-courtyard';
  if (s.includes('kitchen')) return 'kitchen';
  if (s.includes('master') || s.includes('bed')) return 'lifestyle';
  if (s.includes('hammock') || s.includes('firepit')) return 'golden-hour';
  if (s.includes('living')) return 'lifestyle';
  if (s.includes('dan')) return 'golden-hour'; // pro photographer wide shots
  return 'detail';
}

export function listAllProperties() {
  return PROPERTIES.map((p) => ({
    slug: p.slug,
    name: p.name,
    photoCount: p.gallery?.length ?? 0,
  }));
}
