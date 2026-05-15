import { NextResponse } from 'next/server';
import { withAdmin } from '@/lib/auth/admin';
import { PROPERTIES } from '@/lib/constants';
import { getAdminClient } from '@/lib/supabase/admin';
import { regenerateQuarterPlan } from '@/lib/marketing/quarterly';

/**
 * POST /api/admin/marketing/quarter
 *   Regenerates the quarterly market plan for a property, hitting
 *   Perplexity live and persisting the result to marketing_quarterly_plans.
 *
 * Body: { propertySlug, year, quarter }
 *
 * Returns the rebuilt plan so the UI can render without a separate
 * fetch round-trip.
 */
export const POST = withAdmin(async (request, _ctx, auth) => {
  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: 'bad json' }, { status: 400 });
  }
  const { propertySlug, year, quarter } = body || {};

  const property = PROPERTIES.find((p) => p.slug === propertySlug);
  if (!property) {
    return NextResponse.json({ ok: false, error: 'unknown property' }, { status: 400 });
  }
  const y = Number(year);
  const q = Number(quarter);
  if (!Number.isInteger(y) || y < 2020 || y > 2099) {
    return NextResponse.json({ ok: false, error: 'invalid year' }, { status: 400 });
  }
  if (!Number.isInteger(q) || q < 1 || q > 4) {
    return NextResponse.json({ ok: false, error: 'invalid quarter (1-4)' }, { status: 400 });
  }

  // Hydrate property.id from Supabase if we don't have it on the
  // hardcoded PROPERTIES record — the cache upsert needs it.
  const supabase = getAdminClient();
  let propertyWithId = { ...property };
  if (supabase && !property.id) {
    const { data } = await supabase
      .from('properties')
      .select('id, base_adr_usd')
      .eq('slug', property.slug)
      .maybeSingle();
    if (data) {
      propertyWithId = { ...property, ...data };
    }
  }

  try {
    const plan = await regenerateQuarterPlan({
      property: propertyWithId,
      year: y,
      quarter: q,
      generatedBy: auth.user?.id || null,
    });
    return NextResponse.json({ ok: true, plan });
  } catch (err) {
    return NextResponse.json(
      { ok: false, error: String(err?.message || err) },
      { status: 500 },
    );
  }
});
