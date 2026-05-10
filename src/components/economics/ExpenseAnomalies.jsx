import { AlertTriangle, AlertCircle, AlertOctagon } from 'lucide-react';
import { usd } from '@/lib/utils/format';

const SEVERITY_ICON = { high: AlertOctagon, med: AlertTriangle, low: AlertCircle };
const SEVERITY_STYLE = {
  high: 'border-brand-terracotta/40 bg-brand-terracotta/10 text-brand-terracotta',
  med: 'border-brand-gold/40 bg-brand-gold/10 text-brand-gold',
  low: 'border-brand-tan bg-brand-sand/60 text-brand-slate',
};

export function ExpenseAnomalies({ flagged }) {
  if (!flagged?.length) {
    return (
      <div className="rounded-2xl border border-brand-tan/60 bg-brand-cloud p-5 shadow-soft">
        <h3 className="display text-xl text-brand-ink">Expense flags</h3>
        <p className="mt-3 text-sm text-brand-slate">
          No expenses in the last 24 months exceed the variance threshold (1.5σ above comp median or 20%
          over rolling baseline). Clean books — keep going.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-brand-tan/60 bg-brand-cloud p-5 shadow-soft">
      <div className="flex items-baseline justify-between">
        <h3 className="display text-xl text-brand-ink">Expense flags · {flagged.length}</h3>
        <p className="text-[11px] uppercase tracking-widest text-brand-slate/60">
          {'>'}1.5σ vs comp · {'>'}20% over baseline
        </p>
      </div>

      <ul className="mt-4 divide-y divide-brand-tan/60">
        {flagged.map((f, i) => {
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
    </div>
  );
}
