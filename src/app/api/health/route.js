import { NextResponse } from 'next/server';
import { FEATURE_FLAGS } from '@/lib/constants';
import { getPublicReadClient } from '@/lib/supabase/server';
import { perplexityChat } from '@/lib/perplexity/client';
import { findPlace } from '@/lib/google/places';

/**
 * Integration health check. Returns the live/stub status of every
 * external integration. Hit this after adding each Vercel env var
 * to confirm the wiring took effect.
 *
 *   GET /api/health  → JSON
 */
export async function GET() {
  const checks = {};

  // Supabase — read a public table
  const sb = getPublicReadClient();
  if (!sb) {
    checks.supabase = { live: false, reason: 'envs missing' };
  } else {
    try {
      const { error } = await sb.from('properties').select('slug').limit(1);
      checks.supabase = { live: !error, error: error?.message };
    } catch (err) {
      checks.supabase = { live: false, error: String(err) };
    }
  }

  // Perplexity — flag-only (don't burn credits on health check)
  checks.perplexity = {
    live: FEATURE_FLAGS.perplexityLive(),
    note: 'flag-only; hit /intel to test live response',
  };

  // Anthropic — flag-only
  checks.anthropic = {
    live: FEATURE_FLAGS.anthropicLive(),
    note: 'flag-only; hit /api/social/generate-caption to test',
  };

  // Google Places — try a single textsearch (cached 24h)
  if (!FEATURE_FLAGS.googlePlacesLive()) {
    checks.googlePlaces = { live: false, reason: 'GOOGLE_PLACES_API_KEY missing' };
  } else {
    try {
      const r = await findPlace({ query: 'Workshop Kitchen Palm Springs' });
      checks.googlePlaces = { live: true, gotPlaceId: !!r.placeId };
    } catch (err) {
      checks.googlePlaces = { live: false, error: String(err) };
    }
  }

  // Stub-only flags for now (M5/M6 follow-up)
  checks.pricelabs = { live: FEATURE_FLAGS.pricelabsLive() };
  checks.airdna = { live: FEATURE_FLAGS.airdnaLive() };
  checks.metaIg = { live: FEATURE_FLAGS.metaIgLive() };

  const allLive = Object.values(checks).every((c) => c.live);
  return NextResponse.json(
    {
      ok: true,
      allLive,
      checks,
      at: new Date().toISOString(),
    },
    {
      headers: { 'Cache-Control': 'no-store' },
    },
  );
}
