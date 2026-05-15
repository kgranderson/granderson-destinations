import { redirect, notFound } from 'next/navigation';
import { NavBar } from '@/components/shared/NavBar';
import { Footer } from '@/components/shared/Footer';
import { AdminNav } from '@/components/shared/AdminNav';
import { PropertyMarketingTabs } from '@/components/admin/PropertyMarketingTabs';
import { isOwner } from '@/lib/admin/owner-auth';
import { PROPERTIES, ANCHOR_EVENTS_SEED } from '@/lib/constants';
import { NewCampaignForm } from './NewCampaignForm';

export const metadata = { title: 'Marketing · New campaign', robots: { index: false, follow: false } };
export const dynamic = 'force-dynamic';

export default async function NewCampaignPage({ params }) {
  const auth = await isOwner();
  const p = params instanceof Promise ? await params : params;
  if (!auth.authed) redirect(`/admin/login?redirect=/admin/marketing/${p.property}/campaigns/new`);
  const property = PROPERTIES.find((x) => x.slug === p.property);
  if (!property) notFound();
  const profile = auth.profile || { full_name: 'Owner', email: null };

  // Anchor events for this market — operator can tie the campaign to one
  // for event-anchored drafting (21d/14d/7d/1d before).
  const today = new Date().toISOString().slice(0, 10);
  const anchorEvents = ANCHOR_EVENTS_SEED.filter(
    (e) => e.market === property.slug && e.startDate >= today,
  ).sort((a, b) => a.startDate.localeCompare(b.startDate));

  return (
    <>
      <NavBar />
      <main className="animate-page-in bg-brand-cloud pt-24 lg:pt-28">
        <div className="mx-auto flex max-w-[88rem]">
          <AdminNav profile={profile} />
          <div className="min-w-0 flex-1 px-5 py-10 sm:px-8 lg:px-10">
            <p className="text-xs uppercase tracking-[0.32em] text-brand-slate/70">
              Marketing · {property.shortName} · New campaign
            </p>
            <h1 className="display mt-2 text-display-lg text-brand-ink">{property.name}</h1>
            <p className="mt-2 max-w-2xl text-sm text-brand-slate">
              Define the campaign window + theme + target post count. We&rsquo;ll auto-generate
              the draft posts — each with a photo, AI-written caption, and curated hashtags —
              that you review in <strong>Approve</strong> before they publish.
            </p>
            <div className="mt-6">
              <PropertyMarketingTabs propertySlug={property.slug} />
            </div>

            <div className="mt-8 max-w-3xl">
              <NewCampaignForm propertySlug={property.slug} anchorEvents={anchorEvents} />
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
