'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  Upload,
  Sparkles,
  Calendar,
  TrendingUp,
  TrendingDown,
  Minus,
  ExternalLink,
  AlertTriangle,
  CheckCircle2,
} from 'lucide-react';

/**
 * Quarter view client component. Owns the interactive state:
 *  - Refresh-from-Perplexity (POST /api/admin/marketing/quarter)
 *  - Push event uplifts to PriceLabs (POST /api/pricing/push-overrides)
 *  - Quarter navigation (prev/next via Next router push)
 */
export function QuarterView({
  propertySlug,
  year,
  quarter,
  window: quarterWindow,
  plan,
  prevQ,
  nextQ,
  perplexityLive,
}) {
  const router = useRouter();
  const [refreshing, setRefreshing] = useState(false);
  const [pushing, setPushing] = useState(false);
  const [result, setResult] = useState(null); // { ok, kind: 'refresh'|'push', message }

  async function refresh() {
    setRefreshing(true);
    setResult(null);
    try {
      const r = await fetch('/api/admin/marketing/quarter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ propertySlug, year, quarter }),
      });
      const json = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(json.error || `Refresh failed (${r.status})`);
      setResult({
        ok: true,
        kind: 'refresh',
        message: `Plan regenerated · ${json.plan?.intelItems?.length ?? 0} intel item${
          (json.plan?.intelItems?.length ?? 0) === 1 ? '' : 's'
        }${json.plan?.source === 'stub' ? ' (stub Perplexity — no API key)' : ''}.`,
      });
      // Refresh server component data so the page picks up the new cache
      router.refresh();
    } catch (err) {
      setResult({ ok: false, kind: 'refresh', message: err.message });
    } finally {
      setRefreshing(false);
    }
  }

  async function pushToPriceLabs() {
    setPushing(true);
    setResult(null);
    try {
      const r = await fetch('/api/pricing/push-overrides', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        // Event-sync mode WITH explicit window: backend filters anchor
        // events to those overlapping the quarter, so this push only
        // touches PriceLabs overrides for the quarter on screen. Without
        // this scope, the legacy event-sync would push every event in
        // the next 365 days — operator surprise.
        body: JSON.stringify({
          propertySlug,
          window: {
            startDate: quarterWindow.startIso,
            endDate: quarterWindow.endIso,
          },
        }),
      });
      const json = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(json.error || `Push failed (${r.status})`);
      const count = json.pushed ?? json.overrides?.length ?? plan.premiumWindows.length;
      setResult({
        ok: true,
        kind: 'push',
        message: `Pushed ${count} event window${count === 1 ? '' : 's'} to PriceLabs${
          json.stub ? ' (stub mode — no live API call)' : ''
        }.`,
      });
    } catch (err) {
      setResult({ ok: false, kind: 'push', message: err.message });
    } finally {
      setPushing(false);
    }
  }

  return (
    <div className="mt-8 space-y-8">
      {/* Quarter switcher + action bar */}
      <section className="rounded-2xl border border-brand-tan/60 bg-brand-cloud p-5 shadow-soft">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Link
              href={`/admin/marketing/${propertySlug}/quarter?year=${prevQ.year}&quarter=${prevQ.quarter}`}
              className="rounded-full border border-brand-ink/20 p-1.5 text-brand-ink hover:bg-brand-sand/50"
              aria-label="Previous quarter"
            >
              <ChevronLeft size={14} />
            </Link>
            <p className="display text-display-md text-brand-ink">
              {quarterWindow.label.replace(' · ', ' · ')}
            </p>
            <Link
              href={`/admin/marketing/${propertySlug}/quarter?year=${nextQ.year}&quarter=${nextQ.quarter}`}
              className="rounded-full border border-brand-ink/20 p-1.5 text-brand-ink hover:bg-brand-sand/50"
              aria-label="Next quarter"
            >
              <ChevronRight size={14} />
            </Link>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={refresh}
              disabled={refreshing || pushing}
              className="inline-flex items-center gap-1.5 rounded-full border border-brand-ink/30 px-4 py-1.5 text-xs text-brand-ink hover:bg-brand-sand/50 disabled:opacity-40"
            >
              <RefreshCw size={12} className={refreshing ? 'animate-spin' : ''} />
              {refreshing ? 'Refreshing…' : 'Refresh from Perplexity'}
            </button>
            <button
              type="button"
              onClick={pushToPriceLabs}
              disabled={pushing || refreshing || plan.premiumWindows.length === 0}
              className="inline-flex items-center gap-1.5 rounded-full bg-brand-ink px-4 py-1.5 text-xs text-brand-cloud hover:bg-brand-ink/85 disabled:opacity-40"
            >
              <Upload size={12} />
              {pushing ? 'Pushing…' : 'Push quarter to PriceLabs'}
            </button>
          </div>
        </div>

        {/* Cache state + freshness indicator */}
        <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-brand-slate">
          <CacheStatePill state={plan.cacheState} generatedAt={plan.generatedAt} />
          <SourcePill source={plan.source} perplexityLive={perplexityLive} />
        </div>

        {result && (
          <div
            className={`mt-3 flex items-start gap-2 rounded-md p-3 text-sm ${
              result.ok ? 'bg-brand-jade/10 text-brand-jade' : 'bg-rose-50 text-rose-800'
            }`}
          >
            {result.ok ? <CheckCircle2 size={16} /> : <AlertTriangle size={16} />}
            <div>{result.message}</div>
          </div>
        )}
      </section>

      {/* Executive summary */}
      <section className="rounded-2xl border border-brand-tan/60 bg-brand-cloud p-5 shadow-soft">
        <div className="flex items-center gap-2 text-xs uppercase tracking-widest text-brand-slate/70">
          <Sparkles size={12} />
          Executive summary
        </div>
        <p className="mt-2 max-w-3xl text-sm text-brand-ink/85 leading-relaxed">
          {plan.intelSummary}
        </p>
      </section>

      {/* Premium booking windows */}
      <section>
        <div className="flex items-baseline justify-between">
          <h2 className="display text-display-md text-brand-ink">Premium booking windows</h2>
          <p className="text-xs text-brand-slate">
            {plan.premiumWindows.length} event{plan.premiumWindows.length === 1 ? '' : 's'} this
            quarter
          </p>
        </div>
        {plan.premiumWindows.length === 0 ? (
          <p className="mt-4 rounded-2xl border border-dashed border-brand-tan bg-brand-sand/20 p-6 text-center text-sm text-brand-slate">
            No anchor events overlap this quarter.
          </p>
        ) : (
          <div className="mt-4 overflow-hidden rounded-2xl border border-brand-tan/60 bg-brand-cloud">
            <table className="w-full text-sm">
              <thead className="border-b border-brand-tan/60 bg-brand-sand/30 text-xs uppercase tracking-widest text-brand-slate/70">
                <tr>
                  <th className="px-4 py-2 text-left">Event</th>
                  <th className="px-4 py-2 text-left">Window</th>
                  <th className="px-4 py-2 text-right">ADR uplift</th>
                  <th className="px-4 py-2 text-right">Recommended ADR</th>
                  <th className="px-4 py-2 text-right">Min stay</th>
                </tr>
              </thead>
              <tbody>
                {plan.premiumWindows.map((pw) => (
                  <tr
                    key={pw.eventSlug}
                    className="border-b border-brand-tan/40 last:border-b-0"
                  >
                    <td className="px-4 py-3">
                      <div className="font-medium text-brand-ink">{pw.label}</div>
                      {pw.notes && (
                        <div className="mt-0.5 text-xs text-brand-slate/80">{pw.notes}</div>
                      )}
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-brand-slate">
                      {pw.startDate} → {pw.endDate}
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums">
                      <span className="rounded-full bg-brand-gold/30 px-2 py-0.5 text-xs font-medium text-brand-ink">
                        +{Math.round((pw.adrUpliftPct - 1) * 100)}%
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums font-medium text-brand-ink">
                      ${pw.recommendedAdr?.toLocaleString() ?? '—'}
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums text-brand-slate">
                      {pw.recommendedMinStay}n
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* Month-by-month calendar */}
      <section>
        <div className="flex items-baseline justify-between">
          <h2 className="display text-display-md text-brand-ink">Month-by-month</h2>
          <p className="text-xs text-brand-slate">
            {quarterWindow.months.map((m) => m.long).join(' · ')}
          </p>
        </div>
        <div className="mt-4 grid gap-4 lg:grid-cols-3">
          {quarterWindow.months.map((m) => {
            const monthEvents = plan.events.filter((e) => {
              const startMonth = new Date(`${e.startDate}T00:00:00Z`).getUTCMonth();
              return startMonth === m.monthIdx;
            });
            const monthIntel = plan.intelItems.filter((it) => {
              if (!it.earliest_date) return false;
              const eMonth = Number(it.earliest_date.slice(5, 7)) - 1;
              return eMonth === m.monthIdx;
            });
            return (
              <article
                key={m.monthIdx}
                className="flex flex-col rounded-2xl border border-brand-tan/60 bg-brand-cloud p-5 shadow-soft"
              >
                <div className="flex items-center gap-2 text-xs uppercase tracking-widest text-brand-slate/70">
                  <Calendar size={12} />
                  {m.long} {m.year}
                </div>
                <div className="mt-3 space-y-2">
                  {monthEvents.length === 0 && monthIntel.length === 0 && (
                    <p className="text-xs text-brand-slate/60">No events or signals.</p>
                  )}
                  {monthEvents.map((e) => (
                    <div
                      key={e.slug}
                      className="rounded-lg border border-brand-gold/40 bg-brand-gold/10 p-2 text-xs"
                    >
                      <div className="flex items-baseline justify-between gap-2">
                        <span className="font-medium text-brand-ink">{e.name}</span>
                        <span className="font-mono tabular-nums text-brand-ink/70">
                          {e.startDate.slice(5)}–{e.endDate.slice(5)}
                        </span>
                      </div>
                      <div className="text-brand-slate">
                        +{Math.round((e.adrUpliftPct - 1) * 100)}% ADR · {e.minStayNights}n min
                      </div>
                    </div>
                  ))}
                  {monthIntel.map((it) => (
                    <div
                      key={it.id}
                      className="rounded-lg border border-brand-tan/40 bg-white p-2 text-xs"
                    >
                      <div className="flex items-baseline justify-between gap-2">
                        <span className="font-medium text-brand-ink">{it.title}</span>
                        <ImpactIcon impact={it.expected_impact} />
                      </div>
                      {it.summary && (
                        <p className="mt-1 line-clamp-3 text-brand-slate/80">{it.summary}</p>
                      )}
                    </div>
                  ))}
                </div>
              </article>
            );
          })}
        </div>
      </section>

      {/* Full intel list */}
      {plan.intelItems.length > 0 && (
        <section>
          <h2 className="display text-display-md text-brand-ink">Market signals</h2>
          <p className="mt-1 text-xs text-brand-slate">
            From the Perplexity intel feed, filtered to this quarter.
          </p>
          <div className="mt-4 grid gap-3 lg:grid-cols-2">
            {plan.intelItems.map((it) => (
              <article
                key={it.id}
                className="rounded-2xl border border-brand-tan/60 bg-brand-cloud p-4 shadow-soft"
              >
                <div className="flex items-baseline justify-between gap-2">
                  <h3 className="text-sm font-medium text-brand-ink">{it.title}</h3>
                  <ImpactIcon impact={it.expected_impact} />
                </div>
                <div className="mt-1 flex flex-wrap items-center gap-1 text-[10px] uppercase tracking-widest text-brand-slate/70">
                  {it.category && (
                    <span className="rounded-full bg-brand-sand/60 px-2 py-px">{it.category}</span>
                  )}
                  {it.magnitude && (
                    <span className="rounded-full bg-brand-sand/60 px-2 py-px">
                      {it.magnitude} magnitude
                    </span>
                  )}
                  {it.earliest_date && (
                    <span className="font-mono normal-case tracking-normal text-brand-slate/70">
                      {it.earliest_date}
                      {it.latest_date && it.latest_date !== it.earliest_date
                        ? ` → ${it.latest_date}`
                        : ''}
                    </span>
                  )}
                </div>
                {it.summary && (
                  <p className="mt-2 text-xs text-brand-slate leading-relaxed">{it.summary}</p>
                )}
                {it.revenue_thesis && (
                  <p className="mt-2 rounded-md bg-brand-sand/30 p-2 text-xs text-brand-ink/85 leading-relaxed">
                    <span className="font-medium">Revenue thesis: </span>
                    {it.revenue_thesis}
                  </p>
                )}
                {it.source_url && (
                  <a
                    href={it.source_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-3 inline-flex items-center gap-1 text-[11px] text-brand-slate hover:text-brand-ink"
                  >
                    {it.source_title || 'Source'} <ExternalLink size={10} />
                  </a>
                )}
              </article>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

function CacheStatePill({ state, generatedAt }) {
  const generatedMs = generatedAt ? new Date(generatedAt).getTime() : null;
  const ageDays = generatedMs ? Math.floor((Date.now() - generatedMs) / 86_400_000) : null;
  const label =
    state === 'fresh'
      ? `Cached · ${ageDays === 0 ? 'today' : `${ageDays}d ago`}`
      : state === 'stale'
        ? `Cached · ${ageDays}d ago (stale)`
        : 'No cached plan yet';
  const dotColor = state === 'fresh' ? 'bg-brand-jade' : state === 'stale' ? 'bg-amber-500' : 'bg-brand-tan';
  return (
    <span className="inline-flex items-center gap-2 rounded-full border border-brand-tan/60 bg-white px-3 py-1">
      <span className={`h-1.5 w-1.5 rounded-full ${dotColor}`} aria-hidden />
      {label}
    </span>
  );
}

function SourcePill({ source, perplexityLive }) {
  const live = source === 'live' || perplexityLive;
  return (
    <span className="inline-flex items-center gap-2 rounded-full border border-brand-tan/60 bg-white px-3 py-1">
      <span
        className={`h-1.5 w-1.5 rounded-full ${live ? 'bg-brand-jade' : 'bg-brand-tan'}`}
        aria-hidden
      />
      {live ? 'Perplexity live' : 'Stub mode — add PERPLEXITY_API_KEY'}
    </span>
  );
}

function ImpactIcon({ impact }) {
  if (impact === 'positive') return <TrendingUp size={12} className="text-brand-jade" />;
  if (impact === 'negative') return <TrendingDown size={12} className="text-rose-600" />;
  return <Minus size={12} className="text-brand-slate" />;
}
