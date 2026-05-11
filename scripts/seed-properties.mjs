#!/usr/bin/env node
/**
 * Seeds the Supabase `properties` table from the in-memory
 * PROPERTIES array in src/lib/constants.js.
 *
 * Run once per environment after the schema is applied. Idempotent:
 * uses upsert keyed on slug.
 *
 * Usage:
 *   NEXT_PUBLIC_SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... \
 *   node scripts/seed-properties.mjs
 */
import { createClient } from '@supabase/supabase-js';
import { PROPERTIES } from '../src/lib/constants.js';

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) {
  console.error('Missing env: NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const sb = createClient(url, key, { auth: { persistSession: false } });

const rows = PROPERTIES.map((p) => ({
  slug: p.slug,
  name: p.name,
  short_name: p.shortName,
  market: p.slug,
  city: p.city,
  region: p.region,
  country: p.country,
  address_line: p.addressLine,
  lat: p.lat,
  lng: p.lng,
  accent: p.accent,
  bedrooms: p.bedrooms,
  bathrooms: p.bathrooms,
  sleeps: p.sleeps,
  size_sqft: p.sizeSqft,
  hero_image: p.coverImage,
  gallery: p.gallery,
  tagline: p.tagline,
  description: p.description,
  amenities: Object.values(p.amenities || {}).flat(),
  base_adr_usd: p.baseAdrUsd,
  pricelabs_listing_id: p.pricelabsListingId,
  airdna_market_code: p.airdnaMarketCode,
  is_active: true,
  is_primary: !!p.isPrimary,
}));

console.log(`Upserting ${rows.length} properties …`);
const { data, error } = await sb
  .from('properties')
  .upsert(rows, { onConflict: 'slug' })
  .select('id, slug, name');

if (error) {
  console.error('Upsert failed:', error.message);
  process.exit(1);
}

for (const r of data) {
  console.log(`  ✓ ${r.slug.padEnd(28)} ${r.id}  ${r.name}`);
}
console.log('\nDone. Copy these UUIDs if you need them later.');
