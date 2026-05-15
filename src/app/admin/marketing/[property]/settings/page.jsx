import { redirect, notFound } from 'next/navigation';
import { NavBar } from '@/components/shared/NavBar';
import { Footer } from '@/components/shared/Footer';
import { AdminNav } from '@/components/shared/AdminNav';
import { PropertyMarketingTabs } from '@/components/admin/PropertyMarketingTabs';
import { PhaseStub } from '@/components/admin/PhaseStub';
import { isOwner } from '@/lib/admin/owner-auth';
import { PROPERTIES } from '@/lib/constants';

export const metadata = { title: 'Marketing · Settings', robots: { index: false, follow: false } };
export const dynamic = 'force-dynamic';

export default async function MarketingSettingsPage({ params }) {
  const auth = await isOwner();
  const p = params instanceof Promise ? await params : params;
  if (!auth.authed) redirect(`/admin/login?redirect=/admin/marketing/${p.property}/settings`);
  const property = PROPERTIES.find((x) => x.slug === p.property);
  if (!property) notFound();
  const profile = auth.profile || { full_name: 'Owner', email: null };

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
            <div className="mt-6"><PropertyMarketingTabs propertySlug={property.slug} /></div>
            <PhaseStub
              phase="C"
              title="Per-property marketing settings"
              description="Connect this property's Meta Business account: paste the Instagram Business ID + long-lived access token, Facebook Page ID, Meta Ads account, Google Ads customer ID, Resend audience ID, and UTM source tag. Tokens auto-refresh before their 60-day expiry."
              propertySlug={property.slug}
            />
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
