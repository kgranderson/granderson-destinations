import { redirect, notFound } from 'next/navigation';
import Link from 'next/link';
import { Plus, ArrowUpRight } from 'lucide-react';
import { NavBar } from '@/components/shared/NavBar';
import { Footer } from '@/components/shared/Footer';
import { AdminNav } from '@/components/shared/AdminNav';
import { PropertyMarketingTabs } from '@/components/admin/PropertyMarketingTabs';
import { isOwner } from '@/lib/admin/owner-auth';
import { PROPERTIES } from '@/lib/constants';
import { listCampaigns } from '@/lib/marketing/campaigns';

export const metadata = { title: 'Marketing · Campaigns', robots: { index: false, follow: false } };
export const dynamic = 'force-dynamic';

export default async function CampaignsPage({ params }) {
  const auth = await isOwner();
  const p = params instanceof Promise ? await params : params;
  if (!auth.authed) redirect(`/admin/login?redirect=/admin/marketing/${p.property}/campaigns`);
  const property = PROPERTIES.find((x) => x.slug === p.property);
  if (!property) notFound();
  const profile = auth.profile || { full_name: 'Owner', email: null };

  const campaigns = await listCampaigns({ propertySlug: property.slug });
  const totalPending = campaigns.reduce((s, c) => s + (c.counts?.pending || 0), 0);

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
            <p className="mt-2 text-sm text-brand-slate">
              Named, themed marketing campaigns. Each campaign auto-generates draft IG posts that
              you review in <Link href={`/admin/marketing/${property.slug}/approve`} className="underline underline-offset-4">Approve</Link> before they publish.
            </p>
            <div className="mt-6">
              <PropertyMarketingTabs propertySlug={property.slug} />
            </div>

            <div className="mt-8 flex flex-wrap items-baseline justify-between gap-3">
              <div>
                <p className="text-sm text-brand-slate">
                  {campaigns.length} campaign{campaigns.length === 1 ? '' : 's'}
                  {totalPending > 0 && (
                    <>
                      {' · '}
                      <Link
                        href={`/admin/marketing/${property.slug}/approve`}
                        className="text-brand-ink font-medium underline-offset-4 hover:underline"
                      >
                        {totalPending} post{totalPending === 1 ? '' : 's'} awaiting your approval →
                      </Link>
                    </>
                  )}
                </p>
              </div>
              <Link
                href={`/admin/marketing/${property.slug}/campaigns/new`}
                className="inline-flex items-center gap-1.5 rounded-full bg-brand-ink px-4 py-2 text-xs text-brand-cloud hover:bg-brand-ink/85"
              >
                <Plus size={12} /> New campaign
              </Link>
            </div>

            {campaigns.length === 0 ? (
              <section className="mt-6 rounded-2xl border border-dashed border-brand-tan bg-brand-sand/20 p-8 text-center">
                <p className="text-sm text-brand-slate">
                  No campaigns yet. Click <strong>New campaign</strong> above to create one — pick
                  a theme + date window + target post count, and the engine will auto-draft posts
                  for you to review.
                </p>
              </section>
            ) : (
              <div className="mt-6 overflow-hidden rounded-2xl border border-brand-tan/60 bg-brand-cloud">
                <table className="w-full text-sm">
                  <thead className="border-b border-brand-tan/60 bg-brand-sand/30 text-xs uppercase tracking-widest text-brand-slate/70">
                    <tr>
                      <th className="px-4 py-2 text-left">Campaign</th>
                      <th className="px-4 py-2 text-left">Window</th>
                      <th className="px-4 py-2 text-right">Status</th>
                      <th className="px-4 py-2 text-right">Posts</th>
                      <th className="px-4 py-2 text-right">Pending</th>
                      <th className="px-4 py-2"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {campaigns.map((c) => (
                      <tr key={c.id} className="border-b border-brand-tan/40 last:border-b-0">
                        <td className="px-4 py-3">
                          <div className="font-medium text-brand-ink">{c.name}</div>
                          {c.theme && (
                            <div className="text-xs text-brand-slate/70">Theme: {c.theme}</div>
                          )}
                        </td>
                        <td className="px-4 py-3 font-mono text-xs text-brand-slate">
                          {c.start_date} → {c.end_date}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <StatusPill status={c.status} />
                        </td>
                        <td className="px-4 py-3 text-right tabular-nums text-brand-ink">
                          {c.counts?.total || 0}
                        </td>
                        <td className="px-4 py-3 text-right tabular-nums">
                          {c.counts?.pending > 0 ? (
                            <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-800">
                              {c.counts.pending}
                            </span>
                          ) : (
                            <span className="text-brand-slate/40">—</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <Link
                            href={`/admin/marketing/${property.slug}/approve?campaign=${c.id}`}
                            className="inline-flex items-center gap-1 text-xs text-brand-slate hover:text-brand-ink"
                          >
                            Review <ArrowUpRight size={10} />
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}

function StatusPill({ status }) {
  const styles = {
    active: 'bg-brand-jade/15 text-brand-jade',
    draft: 'bg-brand-sand/60 text-brand-slate',
    paused: 'bg-amber-100 text-amber-800',
    completed: 'bg-brand-ink/10 text-brand-ink/70',
    archived: 'bg-brand-tan/40 text-brand-slate',
  };
  return (
    <span className={`rounded-full px-2 py-0.5 text-[10px] uppercase tracking-widest font-medium ${styles[status] || styles.draft}`}>
      {status}
    </span>
  );
}
