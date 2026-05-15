import { redirect, notFound } from 'next/navigation';
import { NavBar } from '@/components/shared/NavBar';
import { Footer } from '@/components/shared/Footer';
import { AdminNav } from '@/components/shared/AdminNav';
import { PropertyMarketingTabs } from '@/components/admin/PropertyMarketingTabs';
import { PhaseStub } from '@/components/admin/PhaseStub';
import { isOwner } from '@/lib/admin/owner-auth';
import { PROPERTIES } from '@/lib/constants';

export const metadata = { title: 'Marketing · Quarter plan', robots: { index: false, follow: false } };
export const dynamic = 'force-dynamic';

export default async function QuarterPlanPage({ params }) {
  const auth = await isOwner();
  const p = params instanceof Promise ? await params : params;
  if (!auth.authed) redirect(`/admin/login?redirect=/admin/marketing/${p.property}/quarter`);
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
              phase="B"
              title="Quarterly market plan"
              description="Perplexity synthesis per market: anchor events, comp-set ADR moves, premium booking windows, comp-set monitoring — all rendered as a quarter calendar with one-click 'recalculate prices' that pushes overrides to PriceLabs."
              propertySlug={property.slug}
            />
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
