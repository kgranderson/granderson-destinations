import { NextResponse } from 'next/server';
import { withAdmin } from '@/lib/auth/admin';
import { loadMetaCreds, maskMetaCreds, saveMetaCreds } from '@/lib/marketing/meta-creds';
import { PROPERTIES } from '@/lib/constants';

/**
 * GET /api/admin/marketing/meta-creds/[slug]
 *   Returns the property's saved Meta credentials with the access
 *   token MASKED (last 4 chars only). Operators can't read the raw
 *   token back out of the system — even admins.
 *
 * PATCH /api/admin/marketing/meta-creds/[slug]
 *   Body: any subset of { ig_business_id, fb_page_id,
 *                         meta_ad_account_id, ig_access_token,
 *                         ig_token_expires_at }
 *   Saves the provided fields. Empty strings clear the field
 *   (operator disconnecting the account).
 */

function requirePropertySlug(slug) {
  const property = PROPERTIES.find((p) => p.slug === slug);
  if (!property) return null;
  return property;
}

export const GET = withAdmin(async (_request, { params }) => {
  const p = params instanceof Promise ? await params : params;
  const property = requirePropertySlug(p?.slug);
  if (!property) {
    return NextResponse.json({ ok: false, error: 'unknown property' }, { status: 404 });
  }
  const creds = await loadMetaCreds(property.slug);
  return NextResponse.json({ ok: true, creds: maskMetaCreds(creds) || { slug: property.slug } });
});

export const PATCH = withAdmin(async (request, { params }) => {
  const p = params instanceof Promise ? await params : params;
  const property = requirePropertySlug(p?.slug);
  if (!property) {
    return NextResponse.json({ ok: false, error: 'unknown property' }, { status: 404 });
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: 'bad json' }, { status: 400 });
  }

  try {
    const updated = await saveMetaCreds(property.slug, body || {});
    return NextResponse.json({ ok: true, creds: updated });
  } catch (err) {
    return NextResponse.json(
      { ok: false, error: String(err?.message || err) },
      { status: 400 },
    );
  }
});
