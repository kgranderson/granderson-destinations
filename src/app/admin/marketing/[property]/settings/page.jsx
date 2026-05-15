import { redirect, notFound } from 'next/navigation';
import { NavBar } from '@/components/shared/NavBar';
import { Footer } from '@/components/shared/Footer';
import { AdminNav } from '@/components/shared/AdminNav';
import { PropertyMarketingTabs } from '@/components/admin/PropertyMarketingTabs';
import { isOwner } from '@/lib/admin/owner-auth';
import { PROPERTIES } from '@/lib/constants';
import { loadMetaCreds, maskMetaCreds } from '@/lib/marketing/meta-creds';
import { MetaCredsForm } from './MetaCredsForm';

export const metadata = { title: 'Marketing · Settings', robots: { index: false, follow: false } };
export const dynamic = 'force-dynamic';

export default async function MarketingSettingsPage({ params }) {
  const auth = await isOwner();
  const p = params instanceof Promise ? await params : params;
  if (!auth.authed) redirect(`/admin/login?redirect=/admin/marketing/${p.property}/settings`);
  const property = PROPERTIES.find((x) => x.slug === p.property);
  if (!property) notFound();
  const profile = auth.profile || { full_name: 'Owner', email: null };

  const raw = await loadMetaCreds(property.slug);
  const creds = maskMetaCreds(raw) || { slug: property.slug };

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
              Connect this property&rsquo;s Meta Business account so campaigns publish to its own
              Instagram feed. Tokens are stored encrypted at the database level and never echoed
              back in plaintext after the first save — you&rsquo;ll see only the last 4 chars to
              confirm what&rsquo;s on file.
            </p>
            <div className="mt-6">
              <PropertyMarketingTabs propertySlug={property.slug} />
            </div>

            <div className="mt-8 max-w-3xl">
              <MetaCredsForm propertySlug={property.slug} initialCreds={creds} />
            </div>

            {/* Setup guidance */}
            <section className="mt-10 max-w-3xl rounded-2xl border border-brand-tan/60 bg-brand-sand/30 p-6">
              <h2 className="display text-display-sm text-brand-ink">How to get these values</h2>
              <ol className="mt-4 space-y-3 text-sm text-brand-slate list-decimal pl-5">
                <li>
                  <strong className="text-brand-ink">Facebook Page:</strong> in Meta Business Suite,
                  create or pick the Page representing this property. The numeric ID is in the
                  Page&rsquo;s &ldquo;About&rdquo; section.
                </li>
                <li>
                  <strong className="text-brand-ink">Instagram Business account:</strong> Settings
                  → Account → Switch to professional → Business → Connect to your Facebook Page.
                  The Business ID lives at <code className="rounded bg-white px-1 text-xs">graph.facebook.com/v21.0/me/accounts</code> once your access token is wired.
                </li>
                <li>
                  <strong className="text-brand-ink">Long-lived access token:</strong> Meta
                  Business Suite → Developers (developers.facebook.com) → My Apps → System User →
                  Generate Token, scopes:{' '}
                  <code className="rounded bg-white px-1 text-xs">
                    instagram_basic, instagram_content_publish, pages_show_list, pages_read_engagement
                  </code>
                  . Long-lived tokens last 60 days.
                </li>
                <li>
                  <strong className="text-brand-ink">Test:</strong> save the form below, then open
                  the Campaigns tab and create a one-post test campaign. The publish cron runs
                  hourly; you&rsquo;ll see the post hit your IG feed within ~60 min of its
                  scheduled time.
                </li>
              </ol>
              <p className="mt-4 text-xs text-brand-slate/70">
                Need a walkthrough?{' '}
                <a
                  href="https://developers.facebook.com/docs/instagram-api/getting-started"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline underline-offset-4 hover:text-brand-ink"
                >
                  Meta&rsquo;s Instagram API getting-started guide
                </a>{' '}
                covers each step with screenshots.
              </p>
            </section>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
