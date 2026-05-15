import { redirect } from 'next/navigation';
import Link from 'next/link';
import { ArrowUpRight, Megaphone, Tags, Calendar, Mail, BarChart3 } from 'lucide-react';
import { NavBar } from '@/components/shared/NavBar';
import { Footer } from '@/components/shared/Footer';
import { AdminNav } from '@/components/shared/AdminNav';
import { isOwner } from '@/lib/admin/owner-auth';
import { PROPERTIES, FEATURE_FLAGS } from '@/lib/constants';
import { buildEventOverrides } from '@/lib/pricelabs/sync';

export const metadata = {
  title: 'Admin · Marketing',
  robots: { index: false, follow: false },
};
export const revalidate = 300;

/**
 * Marketing manager home — property picker + at-a-glance KPI roll-up.
 *
 * Each property card shows the four "is this property's marketing
 * stack healthy?" signals at a glance: PriceLabs sync state, upcoming
 * premium windows, active IG campaigns, and pending approval queue.
 * Click into a property → land on the per-property Pricing tab.
 */
export default async function MarketingHome() {
  const auth = await isOwner();
  if (!auth.authed) redirect('/admin/login?redirect=/admin/marketing');
  const profile = auth.profile || { full_name: 'Owner', email: null };

  const pricelabsLive = FEATURE_FLAGS.pricelabsLive();
  const metaLive = FEATURE_FLAGS.metaIgLive();

  // Per-property roll-up. We hit the event-override builder which is
  // already cached and stub-aware, so this stays cheap even at scale.
  const blocks = PROPERTIES.map((p) => {
    const overrides = buildEventOverrides({ property: p });
    return {
      property: p,
      eventOverrideCount: overrides.length,
      nextEvent: overrides[0] || null,
    };
  });

  return (
    <>
      <NavBar />
      <main className="animate-page-in bg-brand-cloud pt-24 lg:pt-28">
        <div className="mx-auto flex max-w-[88rem]">
          <AdminNav profile={profile} />

          <div className="min-w-0 flex-1 px-5 py-10 sm:px-8 lg:px-10">
            <p className="text-xs uppercase tracking-[0.32em] text-brand-slate/70">
              Admin · Marketing
            </p>
            <h1 className="display mt-2 text-display-lg text-brand-ink">Marketing manager</h1>
            <p className="mt-2 max-w-2xl text-sm text-brand-slate">
              Pricing, quarterly plans, Instagram campaigns, and email — all per property.
              Phase A (Pricing cockpit) is live below; Phases B–D ship in sequence.
            </p>

            {/* Stack health badges */}
            <div className="mt-6 flex flex-wrap items-center gap-3">
              <StatusPill
                label="PriceLabs"
                live={pricelabsLive}
                offlineLabel="Stub mode — add PRICELABS_API_KEY"
              />
              <StatusPill
                label="Meta Instagram"
                live={metaLive}
                offlineLabel="Stub mode — Phase C wires per-property creds"
              />
              <StatusPill label="Perplexity intel" live={true} liveLabel="Cron Mondays 7am" />
            </div>

            {/* Per-property cards */}
            <div className="mt-10 grid gap-5 lg:grid-cols-2 xl:grid-cols-3">
              {blocks.map(({ property: p, eventOverrideCount, nextEvent }) => (
                <PropertyCard
                  key={p.slug}
                  property={p}
                  eventOverrideCount={eventOverrideCount}
                  nextEvent={nextEvent}
                />
              ))}
            </div>

            {/* Roadmap legend */}
            <section className="mt-12 rounded-2xl border border-brand-tan/60 bg-brand-sand/30 p-6">
              <p className="text-xs uppercase tracking-widest text-brand-slate/70">
                Build sequence
              </p>
              <ul className="mt-3 space-y-2 text-sm text-brand-slate">
                <li>
                  <span className="inline-block w-6 font-mono text-brand-jade">A</span>{' '}
                  <strong className="text-brand-ink">Pricing cockpit</strong> — live now
                </li>
                <li>
                  <span className="inline-block w-6 font-mono text-brand-slate">B</span>{' '}
                  Quarterly market plan (Perplexity-driven calendar + premium windows)
                </li>
                <li>
                  <span className="inline-block w-6 font-mono text-brand-slate">C</span>{' '}
                  Instagram campaigns with draft → approve → publish queue
                </li>
                <li>
                  <span className="inline-block w-6 font-mono text-brand-slate">D</span>{' '}
                  Email (Resend) + paid ads roll-up (Meta + Google)
                </li>
              </ul>
            </section>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}

function StatusPill({ label, live, liveLabel, offlineLabel }) {
  return (
    <span className="inline-flex items-center gap-2 rounded-full border border-brand-tan/60 bg-brand-cloud px-3 py-1 text-xs text-brand-slate">
      <span
        className={`h-1.5 w-1.5 rounded-full ${live ? 'bg-brand-jade' : 'bg-brand-tan'}`}
        aria-hidden
      />
      <span className="font-medium text-brand-ink">{label}</span>
      {live
        ? liveLabel
          ? <span className="text-brand-slate">· {liveLabel}</span>
          : <span className="text-brand-jade">live</span>
        : <span className="text-brand-slate">· {offlineLabel}</span>}
    </span>
  );
}

function PropertyCard({ property, eventOverrideCount, nextEvent }) {
  const accentTone = property.accent || 'gold';
  return (
    <article className="group flex flex-col rounded-2xl border border-brand-tan/60 bg-brand-cloud p-6 shadow-soft transition-shadow hover:shadow-lift">
      <div className="flex items-start justify-between">
        <div className="min-w-0">
          <p className="truncate text-xs uppercase tracking-widest text-brand-slate/70">
            {property.shortName || property.city}
          </p>
          <h2 className="display mt-1 truncate text-xl text-brand-ink">{property.name}</h2>
        </div>
        <Link
          href={`/admin/marketing/${property.slug}/pricing`}
          aria-label={`Open ${property.name} marketing`}
          className="text-brand-slate transition-transform hover:text-brand-ink group-hover:-translate-y-0.5 group-hover:translate-x-0.5"
        >
          <ArrowUpRight size={18} />
        </Link>
      </div>

      <ul className="mt-5 space-y-2 text-sm">
        <SignalRow
          icon={Tags}
          label="Event overrides"
          value={`${eventOverrideCount} window${eventOverrideCount === 1 ? '' : 's'}`}
          sub={nextEvent ? `Next: ${nextEvent.label}` : 'No upcoming uplift events'}
        />
        <SignalRow icon={Calendar} label="Quarter plan" value="—" sub="Phase B" />
        <SignalRow icon={Megaphone} label="Active campaigns" value="—" sub="Phase C" />
        <SignalRow icon={Mail} label="Email drips" value="—" sub="Phase D" />
        <SignalRow icon={BarChart3} label="Ad spend (30d)" value="—" sub="Phase D" />
      </ul>

      <div className="mt-6 flex flex-wrap gap-2">
        <Link
          href={`/admin/marketing/${property.slug}/pricing`}
          className="rounded-full bg-brand-ink px-4 py-2 text-xs font-medium text-brand-cloud hover:bg-brand-ink/85"
        >
          Pricing cockpit →
        </Link>
        <Link
          href={`/destinations/${property.slug}`}
          className="rounded-full border border-brand-ink/30 px-4 py-2 text-xs text-brand-ink hover:bg-brand-sand/40"
        >
          View public page
        </Link>
      </div>
    </article>
  );
}

function SignalRow({ icon: Icon, label, value, sub }) {
  return (
    <li className="flex items-baseline justify-between gap-3">
      <span className="inline-flex items-center gap-2 text-brand-slate">
        <Icon size={12} className="opacity-60" />
        {label}
      </span>
      <span className="text-right">
        <span className="font-medium text-brand-ink tabular-nums">{value}</span>
        {sub && (
          <span className="ml-2 text-xs text-brand-slate/70 tabular-nums">{sub}</span>
        )}
      </span>
    </li>
  );
}
