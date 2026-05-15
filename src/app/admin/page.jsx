import Link from 'next/link';
import { redirect } from 'next/navigation';
import { NavBar } from '@/components/shared/NavBar';
import { Footer } from '@/components/shared/Footer';
import { Container } from '@/components/shared/Container';
import { AdminNav } from '@/components/shared/AdminNav';
import { isOwner } from '@/lib/admin/owner-auth';
import { PROPERTIES } from '@/lib/constants';
import { loadMonthly } from '@/lib/economics/loader';
import { loadOccupancy } from '@/lib/hospitable/loader';
import { listMaintenance, countByStatus } from '@/lib/maintenance/loader';
import { rollupMonthly, withDerived } from '@/lib/economics/model';
import { usd, pct } from '@/lib/utils/format';
import {
  LineChart,
  Calendar,
  Wrench,
  ArrowUpRight,
  Upload,
  Plus,
  AlertTriangle,
} from 'lucide-react';

export const metadata = {
  title: 'Admin · Dashboard',
  robots: { index: false, follow: false },
};
export const revalidate = 60;

export default async function AdminHome() {
  const auth = await isOwner();
  if (!auth.authed) redirect('/admin/login?redirect=/admin');
  // Legacy-cookie path has no Supabase profile; synthesize a minimal one for the UI.
  const profile = auth.profile || { full_name: 'Owner', email: null };

  // Roll up portfolio-level stats from existing loaders
  const finBlocks = await Promise.all(
    PROPERTIES.map(async (p) => {
      const { rows } = await loadMonthly(p.slug);
      const rolled = withDerived(rollupMonthly(rows));
      const ttm = rolled.slice(-12);
      const sum = (arr, k) => arr.reduce((s, m) => s + (m[k] || 0), 0);
      return {
        slug: p.slug,
        name: p.name,
        shortName: p.shortName,
        revenue: sum(ttm, 'revenue'),
        noi: sum(ttm, 'revenue') - sum(ttm, 'expenses'),
        margin:
          sum(ttm, 'revenue') > 0
            ? (sum(ttm, 'revenue') - sum(ttm, 'expenses')) / sum(ttm, 'revenue')
            : 0,
      };
    }),
  );

  const occBlocks = await Promise.all(
    PROPERTIES.map(async (p) => {
      const { rows, stub } = await loadOccupancy(p.slug);
      const ttm = rows.slice(-12);
      const booked = ttm.reduce((s, r) => s + (r.nights_booked || 0), 0);
      const available = ttm.reduce((s, r) => s + (r.nights_available || 0), 0);
      return {
        slug: p.slug,
        shortName: p.shortName,
        occupancy: available > 0 ? booked / available : 0,
        nightsBooked: booked,
        stub,
      };
    }),
  );

  const [maintCounts, recent] = await Promise.all([
    countByStatus(),
    listMaintenance(),
  ]);
  const openMaint =
    (maintCounts.open || 0) + (maintCounts.in_progress || 0) + (maintCounts.scheduled || 0);

  const portfolioRev = finBlocks.reduce((s, b) => s + b.revenue, 0);
  const portfolioNoi = finBlocks.reduce((s, b) => s + b.noi, 0);
  const portfolioMargin = portfolioRev > 0 ? portfolioNoi / portfolioRev : 0;
  const portfolioOcc =
    occBlocks.reduce((s, b) => s + b.occupancy, 0) / Math.max(1, occBlocks.length);

  return (
    <>
      <NavBar />
      <main className="animate-page-in bg-brand-cloud pt-24 lg:pt-28">
        <div className="mx-auto flex max-w-[88rem]">
          <AdminNav profile={profile} />

          <div className="min-w-0 flex-1 px-5 py-10 sm:px-8 lg:px-10">
            {/* Welcome */}
            <p className="text-xs uppercase tracking-[0.32em] text-brand-slate/70">
              Welcome back
            </p>
            <h1 className="display mt-2 text-display-lg text-brand-ink">
              {profile.full_name || 'Operator'}
            </h1>
            <p className="mt-2 max-w-2xl text-sm text-brand-slate">
              Portfolio control center. Trailing-twelve performance, occupancy, and open ops items
              across {PROPERTIES.length} {PROPERTIES.length === 1 ? 'property' : 'properties'}.
            </p>

            {/* Portfolio KPIs */}
            <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <KPI label="Portfolio TTM revenue" value={usd(portfolioRev, { fractionDigits: 0 })} />
              <KPI label="Portfolio TTM NOI" value={usd(portfolioNoi, { fractionDigits: 0 })} />
              <KPI label="Avg NOI margin" value={pct(portfolioMargin, { fractionDigits: 1 })} />
              <KPI label="Avg occupancy (TTM)" value={pct(portfolioOcc, { fractionDigits: 1 })} />
            </div>

            {/* Three tool cards */}
            <div className="mt-10 grid gap-4 lg:grid-cols-3">
              <ToolCard
                href="/economics"
                icon={LineChart}
                title="Financial analysis"
                subtitle="P&L, comps, anomalies, what-if levers"
                stats={finBlocks.map((b) => ({
                  label: b.shortName,
                  value: `${usd(b.noi, { fractionDigits: 0 })} NOI`,
                  sub: `${pct(b.margin, { fractionDigits: 0 })} margin`,
                }))}
                action={{ href: '/admin/import', label: 'Import T12', icon: Upload }}
              />
              <ToolCard
                href="/admin/occupancy"
                icon={Calendar}
                title="Occupancy analysis"
                subtitle="Nights booked, ADR, RevPAR by month"
                stats={occBlocks.map((b) => ({
                  label: b.shortName,
                  value: pct(b.occupancy, { fractionDigits: 1 }),
                  sub: `${b.nightsBooked.toLocaleString()} nights (TTM)`,
                }))}
                badge={occBlocks.every((b) => b.stub) ? 'Synthetic — wire Hospitable for live data' : null}
              />
              <ToolCard
                href="/admin/maintenance"
                icon={Wrench}
                title="Maintenance"
                subtitle="Open tickets, assigned vendors, scheduled work"
                stats={[
                  { label: 'Open', value: maintCounts.open || 0, sub: 'unassigned' },
                  { label: 'In progress', value: maintCounts.in_progress || 0, sub: 'with vendor' },
                  { label: 'Scheduled', value: maintCounts.scheduled || 0, sub: 'upcoming' },
                ]}
                action={{ href: '/admin/maintenance', label: 'New request', icon: Plus }}
                urgentCount={openMaint}
              />
            </div>

            {/* Recent activity */}
            {recent.items.length > 0 && (
              <section className="mt-10">
                <div className="flex items-baseline justify-between">
                  <h2 className="display text-display-md text-brand-ink">Recent maintenance</h2>
                  <Link
                    href="/admin/maintenance"
                    className="text-sm font-medium text-brand-ink underline-offset-4 hover:underline"
                  >
                    See all →
                  </Link>
                </div>
                <ul className="mt-4 divide-y divide-brand-tan/60 rounded-2xl border border-brand-tan/60 bg-brand-cloud">
                  {recent.items.slice(0, 5).map((m) => (
                    <li key={m.id} className="flex items-start gap-3 p-4">
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand-sand/60">
                        {m.priority === 'urgent' ? (
                          <AlertTriangle size={14} className="text-brand-terracotta" />
                        ) : (
                          <Wrench size={14} className="text-brand-slate" />
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-brand-ink">{m.title}</p>
                        <p className="text-xs text-brand-slate">
                          {m.property?.short_name} · {m.status.replace('_', ' ')} ·{' '}
                          {new Date(m.created_at).toLocaleDateString()}
                        </p>
                      </div>
                    </li>
                  ))}
                </ul>
              </section>
            )}
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}

function KPI({ label, value }) {
  return (
    <div className="rounded-2xl border border-brand-tan/60 bg-brand-cloud p-5 shadow-soft">
      <p className="text-xs uppercase tracking-[0.22em] text-brand-slate/70">{label}</p>
      <p className="display mt-2 text-3xl text-brand-ink">{value}</p>
    </div>
  );
}

function ToolCard({ href, icon: Icon, title, subtitle, stats, action, badge, urgentCount }) {
  return (
    <article className="group flex flex-col rounded-2xl border border-brand-tan/60 bg-brand-cloud p-6 shadow-soft transition-shadow hover:shadow-lift">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-brand-ink text-brand-cloud">
            <Icon size={16} />
          </span>
          <div>
            <h3 className="text-lg font-medium text-brand-ink">{title}</h3>
            <p className="text-xs text-brand-slate">{subtitle}</p>
          </div>
        </div>
        <Link
          href={href}
          aria-label={`Open ${title}`}
          className="text-brand-slate transition-transform hover:text-brand-ink group-hover:-translate-y-0.5 group-hover:translate-x-0.5"
        >
          <ArrowUpRight size={18} />
        </Link>
      </div>

      {badge && (
        <p className="mt-3 inline-block rounded-full bg-brand-tan/60 px-2.5 py-0.5 text-[10px] uppercase tracking-widest text-brand-slate">
          {badge}
        </p>
      )}

      {urgentCount != null && urgentCount > 0 && (
        <p className="mt-3 inline-flex items-center gap-1 self-start rounded-full bg-brand-terracotta/15 px-2.5 py-0.5 text-[10px] uppercase tracking-widest text-brand-terracotta">
          <AlertTriangle size={10} /> {urgentCount} open
        </p>
      )}

      <ul className="mt-5 space-y-2 text-sm">
        {stats.map((s) => (
          <li key={s.label} className="flex items-baseline justify-between gap-3">
            <span className="text-brand-slate">{s.label}</span>
            <span className="text-right">
              <span className="font-medium text-brand-ink tabular-nums">{s.value}</span>
              {s.sub && (
                <span className="ml-2 text-xs text-brand-slate/70 tabular-nums">{s.sub}</span>
              )}
            </span>
          </li>
        ))}
      </ul>

      <div className="mt-6 flex flex-wrap items-center gap-3">
        <Link
          href={href}
          className="rounded-full border border-brand-ink px-4 py-2 text-xs font-medium text-brand-ink hover:bg-brand-ink hover:text-brand-cloud"
        >
          Open
        </Link>
        {action && (
          <Link
            href={action.href}
            className="inline-flex items-center gap-1.5 rounded-full bg-brand-gold px-4 py-2 text-xs font-medium text-brand-ink hover:bg-brand-gold/85"
          >
            <action.icon size={12} /> {action.label}
          </Link>
        )}
      </div>
    </article>
  );
}
