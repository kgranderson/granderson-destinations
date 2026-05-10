'use client';

import { useState } from 'react';
import { Upload, ArrowUpRight, CheckCircle2, AlertCircle } from 'lucide-react';
import { usd, dateRange } from '@/lib/utils/format';

export function EventOverridesPanel({ overrides = [], propertySlug }) {
  const [pushing, setPushing] = useState(false);
  const [result, setResult] = useState(null);

  async function pushAll() {
    setPushing(true);
    setResult(null);
    try {
      const res = await fetch('/api/pricing/push-overrides', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ propertySlug }),
      });
      const data = await res.json();
      setResult(data);
    } catch (err) {
      setResult({ ok: false, error: String(err) });
    } finally {
      setPushing(false);
    }
  }

  if (!overrides.length) {
    return (
      <div className="rounded-2xl border border-brand-tan/60 bg-brand-cloud p-5 shadow-soft">
        <h3 className="display text-xl text-brand-ink">Event overrides</h3>
        <p className="mt-2 text-sm text-brand-slate">
          No anchor events in the next 12 months for this market — nothing to push.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-brand-tan/60 bg-brand-cloud p-5 shadow-soft">
      <div className="flex flex-wrap items-baseline justify-between gap-3">
        <div>
          <h3 className="display text-xl text-brand-ink">Event overrides · {overrides.length}</h3>
          <p className="mt-1 text-xs text-brand-slate">
            Recommended event-window prices ready to push to PriceLabs.
          </p>
        </div>
        <button
          onClick={pushAll}
          disabled={pushing}
          className="inline-flex items-center gap-2 rounded-full bg-brand-ink px-5 py-2.5 text-sm font-medium text-brand-cloud hover:bg-brand-slate disabled:opacity-50"
        >
          <Upload size={14} />
          {pushing ? 'Pushing…' : 'Push to PriceLabs'}
        </button>
      </div>

      <ul className="mt-5 divide-y divide-brand-tan/60">
        {overrides.map((o) => (
          <li key={o.eventSlug} className="flex items-start justify-between gap-4 py-3">
            <div>
              <p className="text-sm font-medium text-brand-ink">{o.eventName}</p>
              <p className="text-xs text-brand-slate">{dateRange(o.startDate, o.endDate)}</p>
              <p className="text-xs text-brand-slate">
                Min-stay {o.minStayNights} · uplift +{Math.round((o.adrUpliftPct - 1) * 100)}%
              </p>
            </div>
            <div className="text-right">
              <p className="text-xs text-brand-slate">Base {usd(o.basePrice)}</p>
              <p className="display text-lg text-brand-gold">{usd(o.recommendedPrice)}</p>
              <ArrowUpRight size={14} className="ml-auto text-brand-gold" />
            </div>
          </li>
        ))}
      </ul>

      {result && (
        <div
          className={`mt-5 flex items-start gap-2 rounded-xl border p-3 text-sm ${
            result.ok === false
              ? 'border-brand-terracotta/40 bg-brand-terracotta/10 text-brand-terracotta'
              : 'border-brand-jade/40 bg-brand-jade/10 text-brand-jade'
          }`}
        >
          {result.ok === false ? <AlertCircle size={16} /> : <CheckCircle2 size={16} />}
          <p>
            {result.ok === false
              ? `Push failed: ${result.error}`
              : `Queued ${result.pushed} overrides${result.stub ? ' (stub mode — not actually sent to PriceLabs)' : ''}.`}
          </p>
        </div>
      )}
    </div>
  );
}
