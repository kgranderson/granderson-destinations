import { redirect, notFound } from 'next/navigation';
import { isOwner } from '@/lib/admin/owner-auth';
import { PROPERTIES } from '@/lib/constants';

/**
 * Per-property marketing landing. Always redirects to the active
 * default tab (Pricing in Phase A). When Phase B ships the user
 * may want a true overview page here; until then redirecting is
 * the right call because every meaningful action lives in a tab.
 *
 * Auth-gated before the property lookup so unauthed visitors get
 * bounced to /login instead of leaking property-existence (404 vs
 * redirect would otherwise differ for valid vs invalid slugs).
 */
export default async function PropertyMarketingHome({ params }) {
  const auth = await isOwner();
  const p = params instanceof Promise ? await params : params;
  if (!auth.authed) redirect(`/admin/login?redirect=/admin/marketing/${p.property}`);
  const property = PROPERTIES.find((x) => x.slug === p.property);
  if (!property) notFound();
  redirect(`/admin/marketing/${property.slug}/pricing`);
}
