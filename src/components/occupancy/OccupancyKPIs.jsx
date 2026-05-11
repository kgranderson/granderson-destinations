import { Bed, Calendar, TrendingUp, DollarSign } from 'lucide-react';
import { pct, usd } from '@/lib/utils/format';

export function OccupancyKPIs({ rows }) {
  const ttm = rows.slice(-12);
  const prior = rows.slice(-24, -12);

  const sum = (arr, k) => arr.reduce((s, r) => s + (r[k] || 0), 0);
  const occRate = (arr) => {
    const booked = sum(arr, 'nights_booked');
    const available = sum(arr, 'nights_available');
    return available > 0 ? booked / available : 0;
  };

  const ttmOcc = occRate(ttm);
  const priorOcc = occRate(prior);
  const ttmRev = sum(ttm, 'revenue_realized');
  const priorRev = sum(prior, 'revenue_realized');
  const ttmAdr = ttm.length
    ? ttm.reduce((s, r) => s + (r.adr_realized || 0), 0) / ttm.length
    : 0;
  const priorAdr = prior.length
    ? prior.reduce((s, r) => s + (r.adr_realized || 0), 0) / prior.length
    : 0;
  const revPar = ttmAdr * ttmOcc;
  const priorRevPar = priorAdr * priorOcc;

  const cards = [
    {
      label: 'Occupancy (TTM)',
      value: pct(ttmOcc, { fractionDigits: 1 }),
      delta: priorOcc ? (ttmOcc - priorOcc) / priorOcc : 0,
      icon: Calendar,
    },
    {
      label: 'Nights booked (TTM)',
      value: sum(ttm, 'nights_booked').toLocaleString(),
      delta: 0,
      icon: Bed,
    },
    {
      label: 'Avg realized ADR',
      value: usd(ttmAdr, { fractionDigits: 0 }),
      delta: priorAdr ? (ttmAdr - priorAdr) / priorAdr : 0,
      icon: DollarSign,
    },
    {
      label: 'RevPAR (TTM)',
      value: usd(revPar, { fractionDigits: 0 }),
      delta: priorRevPar ? (revPar - priorRevPar) / priorRevPar : 0,
      icon: TrendingUp,
    },
  ];

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {cards.map((c) => (
        <Card key={c.label} {...c} />
      ))}
    </div>
  );
}

function Card({ label, value, delta, icon: Icon }) {
  const positive = (delta ?? 0) >= 0;
  return (
    <div className="rounded-2xl border border-brand-tan/60 bg-brand-cloud p-5 shadow-soft">
      <div className="flex items-center justify-between">
        <p className="text-xs uppercase tracking-[0.22em] text-brand-slate/70">{label}</p>
        <Icon size={14} className="text-brand-slate" />
      </div>
      <p className="display mt-2 text-3xl text-brand-ink">{value}</p>
      {Number.isFinite(delta) && Math.abs(delta) > 0.001 && (
        <p className={`mt-1 text-xs font-medium ${positive ? 'text-brand-jade' : 'text-brand-terracotta'}`}>
          {positive ? '+' : ''}
          {(delta * 100).toFixed(1)}% YoY
        </p>
      )}
    </div>
  );
}
