import { notFound } from 'next/navigation';
import Link from 'next/link';
import { NavBar } from '@/components/shared/NavBar';
import { Footer } from '@/components/shared/Footer';
import { AdminNav } from '@/components/shared/AdminNav';
import { assertAdmin } from '@/components/shared/AdminGuard';
import { OccupancyKPIs } from '@/components/occupancy/OccupancyKPIs';
import { OccupancyChart } from '@/components/occupancy/OccupancyChart';
import { PropertyAdminTabs } from '@/components/shared/PropertyAdminTabs';
import { PROPERTIES } from '@/lib/constants';
import { loadOccupancy } from '@/lib/hospitable/loader';

export const metadata = { title: 'Admin · Occupancy', robots: { index: false, follow: false } };
export const revalidate = 600;

export async function generateStaticParams() {
  return PROPERTIES.map((p) => ({ slug: p.slug }));
}

export default async function OccupancyPropertyPage({ params }) {
  const auth = await assertAdmin();
  if (!auth.ok) return auth.render;

  const property = PROPERTIES.find((p) => p.slug === params.slug);
  if (!property) notFound();

  const { rows, stub } = await loadOccupancy(property.slug);

  return (
    <>
      <NavBar />
      <main className="animate-page-in bg-brand-cloud pt-24 lg:pt-28">
        <div className="mx-auto flex max-w-[88rem]">
          <AdminNav profile={auth.profile} />
          <div className="min-w-0 flex-1 px-5 py-10 sm:px-8 lg:px-10">
            <div className="flex flex-wrap items-end justify-between gap-4">
              <div>
                <p className="text-xs uppercase tracking-[0.32em] text-brand-slate/70">
                  Occupancy · {property.shortName}
                </p>
                <h1 className="display mt-3 text-display-lg text-brand-ink">{property.name}</h1>
              </div>
              <div className="flex flex-wrap items-center gap-3">
                {stub && (
                  <span className="rounded-full bg-brand-tan/60 px-3 py-1 text-[10px] uppercase tracking-widest text-brand-slate">
                    Synthetic · Hospitable live when key is set
                  </span>
                )}
                <Link
                  href={`/economics/${property.slug}`}
                  className="rounded-full border border-brand-ink px-4 py-2 text-xs font-medium text-brand-ink hover:bg-brand-ink hover:text-brand-cloud"
                >
                  Financial →
                </Link>
              </div>
            </div>

            <div className="mt-8">
              <PropertyAdminTabs propertySlug={property.slug} />
            </div>

            <div className="mt-8">
              <OccupancyKPIs rows={rows} />
            </div>

            <div className="mt-8">
              <OccupancyChart rows={rows} />
            </div>

            {stub && (
              <div className="mt-8 rounded-2xl border border-brand-tan/60 bg-brand-sand/40 p-6">
                <p className="text-sm font-medium text-brand-ink">Wire real occupancy data</p>
                <p className="mt-2 text-sm text-brand-slate">
                  Two options to replace this synthetic data:
                </p>
                <ol className="mt-3 list-decimal space-y-1 pl-5 text-sm text-brand-slate">
                  <li>
                    Subscribe to a Hospitable plan, import this property into Hospitable, generate
                    a Public API token, and add{' '}
                    <code className="rounded bg-brand-tan/40 px-1">HOSPITABLE_API_KEY</code> to
                    Vercel env vars. The page auto-flips to live.
                  </li>
                  <li>
                    Insert rows directly into the{' '}
                    <code className="rounded bg-brand-tan/40 px-1">occupancy_records</code>{' '}
                    Supabase table (one row per month: nights_booked, nights_available,
                    adr_realized).
                  </li>
                </ol>
              </div>
            )}
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
