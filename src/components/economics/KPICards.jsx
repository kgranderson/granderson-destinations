import { TrendingUp, TrendingDown } from 'lucide-react';
import { usd, pct } from '@/lib/utils/format';

export function KPICards({ kpis }) {
  const cards = [
    { label: 'Trailing-12 revenue',  value: usd(kpis.ttmRevenue), delta: kpis.revYoy, kind: 'currency' },
    { label: 'Trailing-12 expenses', value: usd(kpis.ttmExpense), delta: kpis.expYoy, kind: 'currency', invertColor: true },
    { label: 'Trailing-12 NOI',      value: usd(kpis.ttmNoi),     delta: kpis.noiYoy, kind: 'currency' },
    { label: 'NOI margin',           value: pct(kpis.margin, { fractionDigits: 1 }), delta: kpis.marginYoy, kind: 'pct' },
    { label: 'RevPAR (30d)',         value: usd(kpis.revPar30, { fractionDigits: 0 }), delta: kpis.revPar30Yoy, kind: 'currency' },
    { label: 'Last-month revenue',   value: usd(kpis.lastMonthRevenue), delta: kpis.lastMonthYoy, kind: 'currency' },
  ];
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {cards.map((c) => (
        <Card key={c.label} {...c} />
      ))}
    </div>
  );
}

function Card({ label, value, delta, invertColor = false }) {
  const positive = (delta ?? 0) >= 0;
  // For expenses, negative YoY is good
  const goodColor = invertColor ? !positive : positive;
  const Icon = positive ? TrendingUp : TrendingDown;
  return (
    <div className="rounded-2xl border border-brand-tan/60 bg-brand-cloud p-5 shadow-soft">
      <p className="text-xs uppercase tracking-[0.22em] text-brand-slate/70">{label}</p>
      <p className="display mt-2 text-3xl text-brand-ink">{value}</p>
      {Number.isFinite(delta) && (
        <p
          className={`mt-2 inline-flex items-center gap-1 text-xs font-medium ${
            goodColor ? 'text-brand-jade' : 'text-brand-terracotta'
          }`}
        >
          <Icon size={12} /> {(delta * 100).toFixed(1)}% YoY
        </p>
      )}
    </div>
  );
}
