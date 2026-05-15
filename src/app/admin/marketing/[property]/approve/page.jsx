import { redirect, notFound } from 'next/navigation';
import { NavBar } from '@/components/shared/NavBar';
import { Footer } from '@/components/shared/Footer';
import { AdminNav } from '@/components/shared/AdminNav';
import { PropertyMarketingTabs } from '@/components/admin/PropertyMarketingTabs';
import { isOwner } from '@/lib/admin/owner-auth';
import { PROPERTIES } from '@/lib/constants';
import { listPendingPosts } from '@/lib/marketing/posts';
import { loadMetaCreds, hasPropertyCreds } from '@/lib/marketing/meta-creds';
import { ApprovalQueue } from './ApprovalQueue';

export const metadata = { title: 'Marketing · Approve', robots: { index: false, follow: false } };
export const dynamic = 'force-dynamic';

export default async function ApprovePage({ params, searchParams }) {
  const auth = await isOwner();
  const p = params instanceof Promise ? await params : params;
  const sp = searchParams instanceof Promise ? await searchParams : searchParams;
  if (!auth.authed) redirect(`/admin/login?redirect=/admin/marketing/${p.property}/approve`);
  const property = PROPERTIES.find((x) => x.slug === p.property);
  if (!property) notFound();
  const profile = auth.profile || { full_name: 'Owner', email: null };

  const includeApproved = sp?.show === 'all';
  const allPosts = await listPendingPosts({
    propertySlug: property.slug,
    includeApproved,
    limit: 100,
  });

  // If a ?campaign=X query is present, filter the queue to that campaign
  const campaignId = sp?.campaign || null;
  const posts = campaignId ? allPosts.filter((p) => p.campaign_id === campaignId) : allPosts;

  // Pre-publish health check: warn the operator if Meta creds aren't set
  // — the publish cron will treat their posts as stubs until creds land.
  const creds = await loadMetaCreds(property.slug);
  const credsConnected = hasPropertyCreds(creds);

  return (
    <>
      <NavBar />
      <main className="animate-page-in bg-brand-cloud pt-24 lg:pt-28">
        <div className="mx-auto flex max-w-[88rem]">
          <AdminNav profile={profile} />
          <div className="min-w-0 flex-1 px-5 py-10 sm:px-8 lg:px-10">
            <p className="text-xs uppercase tracking-[0.32em] text-brand-slate/70">
              Marketing · {property.shortName}
            </p>
            <h1 className="display mt-2 text-display-lg text-brand-ink">{property.name}</h1>
            <p className="mt-2 max-w-2xl text-sm text-brand-slate">
              Draft posts awaiting your approval. Edit the caption, schedule, or hashtags inline,
              then approve or reject. Approved posts publish at their scheduled time via the
              hourly cron.
            </p>
            <div className="mt-6">
              <PropertyMarketingTabs propertySlug={property.slug} />
            </div>

            <ApprovalQueue
              propertySlug={property.slug}
              propertyShortName={property.shortName}
              initialPosts={posts}
              includeApproved={includeApproved}
              credsConnected={credsConnected}
              filteredCampaignId={campaignId}
            />
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
