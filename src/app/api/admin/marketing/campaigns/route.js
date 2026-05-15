import { NextResponse } from 'next/server';
import { withAdmin } from '@/lib/auth/admin';
import { createCampaign, listCampaigns } from '@/lib/marketing/campaigns';

/**
 * GET  /api/admin/marketing/campaigns?propertySlug=palm-springs
 *      → list this property's campaigns with post counts
 *
 * POST /api/admin/marketing/campaigns
 *      Body: { propertySlug, name, theme?, anchorEventSlug?, startDate,
 *              endDate, targetPostCount?, goalBookings?, notes?, objective? }
 *      Creates the campaign + generates draft posts in ig_posts.
 */

export const GET = withAdmin(async (request) => {
  const url = new URL(request.url);
  const propertySlug = url.searchParams.get('propertySlug');
  if (!propertySlug) {
    return NextResponse.json({ ok: false, error: 'propertySlug required' }, { status: 400 });
  }
  const campaigns = await listCampaigns({ propertySlug });
  return NextResponse.json({ ok: true, campaigns });
});

export const POST = withAdmin(async (request, _ctx, auth) => {
  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: 'bad json' }, { status: 400 });
  }

  if (!body?.propertySlug || !body?.name || !body?.startDate || !body?.endDate) {
    return NextResponse.json(
      { ok: false, error: 'propertySlug, name, startDate, endDate are required' },
      { status: 400 },
    );
  }

  try {
    const result = await createCampaign({
      propertySlug: body.propertySlug,
      name: body.name,
      objective: body.objective,
      theme: body.theme,
      anchorEventSlug: body.anchorEventSlug,
      startDate: body.startDate,
      endDate: body.endDate,
      targetPostCount: body.targetPostCount,
      goalBookings: body.goalBookings,
      notes: body.notes,
      createdBy: auth.user?.id || null,
    });
    return NextResponse.json({ ok: true, ...result });
  } catch (err) {
    return NextResponse.json(
      { ok: false, error: String(err?.message || err) },
      { status: 400 },
    );
  }
});
