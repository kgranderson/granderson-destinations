'use client';

import { useState } from 'react';
import {
  AlertTriangle,
  AlertCircle,
  AlertOctagon,
  ChevronDown,
} from 'lucide-react';
import { usd } from '@/lib/utils/format';

const SEVERITY_ICON = { high: AlertOctagon, med: AlertTriangle, low: AlertCircle };
const SEVERITY_STYLE = {
  high: 'border-brand-terracotta/40 bg-brand-terracotta/10 text-brand-terracotta',
  med: 'border-brand-gold/40 bg-brand-gold/10 text-brand-gold',
  low: 'border-brand-tan bg-brand-sand/60 text-brand-slate',
};
const SEVERITY_DOT = {
  high: 'bg-brand-terracotta',
  med: 'bg-brand-gold',
  low: 'bg-brand-tan',
};

/**
 * Collapsible summary card. Shows severity-bucket counts inline;
 * expand reveals the full flagged list. Avoids dominating the
 * dashboard when many anomalies are present.
 */
export function ExpenseAnomalies({ flagged = [] }) {
  const [expanded, setExpanded] = useState(false);

  if (!flagged.length) {
    return (
      <div className="rounded-2xl border border-brand-tan/60 bg-brand-cloud p-5 shadow-soft">
        <h3 className="display text-xl text-brand-ink">Expense flags</h3>
        <p className="mt-3 text-sm text-brand-slate">
          No expenses in the last 24 months exceed the variance threshold (1.5σ vs comp set or 20%
          over rolling baseline). Clean books — keep going.
        </p>
      </div>
    );
  }

  // Bucket counts by severity
  const counts = flagged.reduce(
    (acc, f) => {
      acc[f.severity] = (acc[f.severity] || 0) + 1;
      return acc;
    },
    { high: 0, med: 0, low: 0 },
  );

  // Top 3 by amount when collapsed; full list when expanded
  const sorted = [...flagged].sort((a, b) => (b.amount || 0) - (a.amount || 0));
  const visible = expanded ? sorted : sorted.slice(0, 3);

  return (
    <div className="rounded-2xl border border-brand-tan/60 bg-brand-cloud p-5 shadow-soft">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="display text-xl text-brand-ink">Expense flags · {flagged.length}</h3>
          <p className="mt-1 text-[11px] uppercase tracking-widest text-brand-slate/60">
            {'>'}1.5σ vs comp · {'>'}20% over baseline
          </p>
        </div>

        {/* Severity-bucket counts */}
        <div className="flex flex-wrap gap-2 text-xs">
          {counts.high > 0 && (
            <SeverityChip kind="high" count={counts.high} label="high" />
          )}
          {counts.med > 0 && (
            <SeverityChip kind="med" count={counts.med} label="medium" />
          )}
          {counts.low > 0 && (
            <SeverityChip kind="low" count={counts.low} label="low" />
          )}
        </div>
      </div>

      {/* Top 3 (or full list when expanded) */}
      <ul className="mt-4 divide-y divide-brand-tan/60">
        {visible.map((f, i) => {
          const Icon = SEVERITY_ICON[f.severity] || AlertCircle;
          return (
            <li key={i} className="flex items-start gap-3 py-3">
              <span
                className={`inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full border ${SEVERITY_STYLE[f.severity]}`}
              >
                <Icon size={16} />
              </span>
              <div className="flex-1">
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <p className="font-medium text-brand-ink">
                    {f.category} · {f.month}
                  </p>
                  <p className="font-medium text-brand-ink tabular-nums">{usd(f.amount)}</p>
                </div>
                <p className="text-xs text-brand-slate">
                  Baseline {usd(f.baseline, { fractionDigits: 0 })}
                  {f.compMedian != null
                    ? ` · comp median ${usd(f.compMedian, { fractionDigits: 0 })}`
                    : ''}
                  {f.pctOverBaseline != null
                    ? ` · ${Math.round(f.pctOverBaseline * 100)}% over baseline`
                    : ''}
                </p>
              </div>
            </li>
          );
        })}
      </ul>

      {flagged.length > 3 && (
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          className="mt-3 inline-flex items-center gap-1 text-xs font-medium text-brand-ink underline-offset-4 hover:underline"
        >
          {expanded ? 'Collapse' : `View all ${flagged.length} flagged expenses`}
          <ChevronDown
            size={14}
            className={`transition-transform ${expanded ? 'rotate-180' : ''}`}
          />
        </button>
      )}
    </div>
  );
}

function SeverityChip({ kind, count, label }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-brand-tan/60 bg-brand-sand/40 px-2.5 py-1 text-brand-slate">
      <span className={`h-2 w-2 rounded-full ${SEVERITY_DOT[kind]}`} aria-hidden />
      <span className="tabular-nums font-medium text-brand-ink">{count}</span>
      <span className="text-[10px] uppercase tracking-widest">{label}</span>
    </span>
  );
}
