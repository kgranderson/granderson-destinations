'use client';

import { useMemo, useState } from 'react';
import { Calendar, Upload, RotateCcw, AlertTriangle, CheckCircle2 } from 'lucide-react';

/**
 * Interactive PriceLabs cockpit.
 *
 *  - Renders the 90-day forward price grid (one row per day), with
 *    weekend rows highlighted and event-override windows tinted.
 *  - Operator can override any day's ADR inline; we never mutate
 *    PriceLabs until they click "Push overrides to PriceLabs", which
 *    POSTs the diff (only days they changed) to /api/pricing/push-overrides.
 *  - The "Apply event uplift" button bulk-fills overrides for every
 *    day inside the upcoming event window using the recommended ADR
 *    from the events/premium calculator.
 *
 * Keeping the override editor entirely client-side until the push
 * means an operator can experiment without risk — nothing reaches
 * PriceLabs until they commit.
 */
export function PricingCockpit({ propertySlug, listingId, initialPrices, eventOverrides }) {
  // Per-day operator overrides: { [yyyy-mm-dd]: number }
  const [overrides, setOverrides] = useState({});
  const [pushing, setPushing] = useState(false);
  const [pushResult, setPushResult] = useState(null); // { ok, count?, error? }

  // Index event-override windows by date for quick lookup when rendering rows
  const eventByDate = useMemo(() => {
    const map = new Map();
    for (const ev of eventOverrides) {
      // ev shape: { label, startDate, endDate, recommendedAdr, adrUpliftPct }
      const start = new Date(ev.startDate);
      const end = new Date(ev.endDate);
      for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
        map.set(d.toISOString().slice(0, 10), ev);
      }
    }
    return map;
  }, [eventOverrides]);

  const dirtyCount = Object.keys(overrides).length;

  function setOverride(date, value) {
    setOverrides((prev) => {
      const next = { ...prev };
      const num = Number(value);
      if (!value || !Number.isFinite(num) || num <= 0) {
        delete next[date];
      } else {
        next[date] = Math.round(num);
      }
      return next;
    });
    setPushResult(null);
  }

  function applyEventUplift(ev) {
    setOverrides((prev) => {
      const next = { ...prev };
      const start = new Date(ev.startDate);
      const end = new Date(ev.endDate);
      for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
        const iso = d.toISOString().slice(0, 10);
        next[iso] = Math.round(ev.recommendedAdr);
      }
      return next;
    });
    setPushResult(null);
  }

  function clearAll() {
    setOverrides({});
    setPushResult(null);
  }

  async function pushOverrides() {
    setPushing(true);
    setPushResult(null);
    try {
      // Build the payload — only days the operator actually changed
      const payload = Object.entries(overrides).map(([date, price]) => ({
        date,
        price,
        currency: 'USD',
        source: 'cockpit',
      }));
      const res = await fetch('/api/pricing/push-overrides', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ propertySlug, listingId, overrides: payload }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        // 502 from server means PriceLabs rejected the live push;
        // surface its error message verbatim so operator can see why.
        throw new Error(json.error || `Push failed (${res.status})`);
      }
      setPushResult({
        ok: true,
        count: json.pushed ?? payload.length,
        rejected: json.rejected,   // server-side rejections (validation)
        stub: !!json.stub,
      });
      // Don't clear overrides — the operator may want to keep iterating.
    } catch (err) {
      setPushResult({ ok: false, error: err.message || 'Push failed' });
    } finally {
      setPushing(false);
    }
  }

  return (
    <div className="space-y-8">
      {/* Action bar */}
      <section className="rounded-2xl border border-brand-tan/60 bg-brand-cloud p-5 shadow-soft">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-widest text-brand-slate/70">Overrides</p>
            <p className="mt-1 text-sm text-brand-ink">
              {dirtyCount === 0
                ? 'No overrides queued. Edit any row below to start.'
                : `${dirtyCount} day${dirtyCount === 1 ? '' : 's'} pending push.`}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={clearAll}
              disabled={dirtyCount === 0 || pushing}
              className="inline-flex items-center gap-1.5 rounded-full border border-brand-ink/30 px-4 py-1.5 text-xs text-brand-ink hover:bg-brand-sand/50 disabled:opacity-40"
            >
              <RotateCcw size={12} /> Clear
            </button>
            <button
              type="button"
              onClick={pushOverrides}
              disabled={dirtyCount === 0 || pushing}
              className="inline-flex items-center gap-1.5 rounded-full bg-brand-ink px-4 py-1.5 text-xs text-brand-cloud hover:bg-brand-ink/85 disabled:opacity-50"
            >
              <Upload size={12} /> {pushing ? 'Pushing…' : 'Push to PriceLabs'}
            </button>
          </div>
        </div>
        {pushResult && (
          <div
            className={`mt-3 flex items-start gap-2 rounded-md p-3 text-sm ${
              pushResult.ok
                ? 'bg-brand-jade/10 text-brand-jade'
                : 'bg-rose-50 text-rose-800'
            }`}
          >
            {pushResult.ok ? <CheckCircle2 size={16} /> : <AlertTriangle size={16} />}
            <div>
              {pushResult.ok ? (
                <>
                  Pushed {pushResult.count} override
                  {pushResult.count === 1 ? '' : 's'}
                  {pushResult.stub
                    ? ' (stub mode — no live API call)'
                    : ' to PriceLabs'}
                  .
                  {pushResult.rejected?.length > 0 && (
                    <span className="ml-2 text-rose-700">
                      ({pushResult.rejected.length} row
                      {pushResult.rejected.length === 1 ? '' : 's'} rejected by validation)
                    </span>
                  )}
                </>
              ) : (
                pushResult.error
              )}
            </div>
          </div>
        )}
      </section>

      {/* Event uplift quick-apply */}
      {eventOverrides.length > 0 && (
        <section>
          <h2 className="display text-display-md text-brand-ink">Event uplift windows</h2>
          <p className="mt-1 text-sm text-brand-slate">
            Quick-apply recommended ADRs from the event premium calculator. Each click overwrites
            every day inside the event window.
          </p>
          <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {eventOverrides.map((ev) => (
              <article
                key={`${ev.label}-${ev.startDate}`}
                className="flex flex-col rounded-xl border border-brand-tan/60 bg-brand-cloud p-4 shadow-soft"
              >
                <div className="flex items-center gap-2 text-xs uppercase tracking-widest text-brand-slate/70">
                  <Calendar size={12} />
                  {ev.startDate} → {ev.endDate}
                </div>
                <p className="mt-2 text-sm font-medium text-brand-ink">{ev.label}</p>
                <p className="mt-1 text-xs text-brand-slate">
                  Recommended ADR:{' '}
                  <span className="font-medium text-brand-ink tabular-nums">
                    ${Math.round(ev.recommendedAdr).toLocaleString()}
                  </span>{' '}
                  ({ev.adrUpliftPct ? `+${Math.round((ev.adrUpliftPct - 1) * 100)}%` : '—'})
                </p>
                <button
                  type="button"
                  onClick={() => applyEventUplift(ev)}
                  className="mt-3 self-start rounded-full border border-brand-ink/40 px-3 py-1 text-[11px] text-brand-ink hover:bg-brand-sand/50"
                >
                  Apply to {daysBetween(ev.startDate, ev.endDate)} days
                </button>
              </article>
            ))}
          </div>
        </section>
      )}

      {/* 90-day pricing table */}
      <section>
        <div className="flex items-baseline justify-between">
          <h2 className="display text-display-md text-brand-ink">90-day recommended pricing</h2>
          <p className="text-xs text-brand-slate">From PriceLabs · weekends highlighted</p>
        </div>
        <div className="mt-4 overflow-hidden rounded-2xl border border-brand-tan/60 bg-brand-cloud">
          <table className="w-full text-sm">
            <thead className="border-b border-brand-tan/60 bg-brand-sand/30 text-xs uppercase tracking-widest text-brand-slate/70">
              <tr>
                <th className="px-4 py-2 text-left">Date</th>
                <th className="px-4 py-2 text-left">Day</th>
                <th className="px-4 py-2 text-right">PriceLabs ADR</th>
                <th className="px-4 py-2 text-right">Min stay</th>
                <th className="px-4 py-2 text-right">Override</th>
                <th className="px-4 py-2 text-right">Event</th>
              </tr>
            </thead>
            <tbody>
              {initialPrices.map((row) => {
                const d = new Date(row.date);
                const dow = d.getDay();
                const isWeekend = dow === 5 || dow === 6;
                const dayLabel = d.toLocaleDateString('en-US', { weekday: 'short' });
                const event = eventByDate.get(row.date);
                const override = overrides[row.date];
                return (
                  <tr
                    key={row.date}
                    className={`border-b border-brand-tan/40 last:border-b-0 ${
                      event ? 'bg-brand-gold/10' : isWeekend ? 'bg-brand-sand/20' : ''
                    }`}
                  >
                    <td className="px-4 py-2 font-mono text-xs text-brand-ink">{row.date}</td>
                    <td className="px-4 py-2 text-xs text-brand-slate">{dayLabel}</td>
                    <td className="px-4 py-2 text-right tabular-nums text-brand-ink">
                      ${row.price.toLocaleString()}
                    </td>
                    <td className="px-4 py-2 text-right text-xs text-brand-slate tabular-nums">
                      {row.minStay || 1}
                    </td>
                    <td className="px-4 py-2 text-right">
                      <input
                        type="number"
                        min="0"
                        step="5"
                        placeholder="—"
                        value={override ?? ''}
                        onChange={(e) => setOverride(row.date, e.target.value)}
                        className={`w-24 rounded-md border bg-white px-2 py-1 text-right text-xs tabular-nums focus:outline-none focus:ring-1 focus:ring-brand-ink ${
                          override ? 'border-brand-jade font-medium text-brand-jade' : 'border-brand-slate/20 text-brand-ink'
                        }`}
                      />
                    </td>
                    <td className="px-4 py-2 text-right text-xs">
                      {event ? (
                        <span className="rounded-full bg-brand-gold/30 px-2 py-0.5 text-[10px] uppercase tracking-widest text-brand-ink">
                          {event.label}
                        </span>
                      ) : (
                        <span className="text-brand-slate/40">—</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {initialPrices.length === 0 && (
            <div className="px-4 py-8 text-center text-sm text-brand-slate">
              No price data returned from PriceLabs.
            </div>
          )}
        </div>
      </section>
    </div>
  );
}

function daysBetween(startIso, endIso) {
  const s = new Date(startIso);
  const e = new Date(endIso);
  return Math.max(1, Math.round((e - s) / 86_400_000) + 1);
}
