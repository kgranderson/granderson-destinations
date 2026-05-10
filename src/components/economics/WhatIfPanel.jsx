'use client';

import { useState } from 'react';
import { whatIf } from '@/lib/economics/model';
import { usd } from '@/lib/utils/format';

export function WhatIfPanel({ baseAdr, baseOccupancy, lastMonthRevenue }) {
  const [adrDelta, setAdrDelta] = useState(0);
  const [occDelta, setOccDelta] = useState(0);
  const [nights, setNights] = useState(30);

  const result = whatIf({
    baseAdr,
    baseOccupancy,
    deltaAdrPct: adrDelta,
    deltaOccPct: occDelta,
    nights,
  });

  return (
    <div className="rounded-2xl border border-brand-tan/60 bg-brand-cloud p-5 shadow-soft">
      <div className="flex items-baseline justify-between">
        <h3 className="display text-xl text-brand-ink">Revenue levers</h3>
        <p className="text-[11px] uppercase tracking-widest text-brand-slate/60">
          monthly · USD
        </p>
      </div>
      <p className="mt-1 text-xs text-brand-slate">
        Move the levers — see how a small change in ADR or occupancy translates into incremental
        revenue per month.
      </p>

      <div className="mt-5 space-y-4">
        <Slider
          label="ADR change"
          value={adrDelta}
          min={-0.2}
          max={0.4}
          step={0.01}
          onChange={setAdrDelta}
          format={(n) => `${n >= 0 ? '+' : ''}${(n * 100).toFixed(0)}%`}
        />
        <Slider
          label="Occupancy change"
          value={occDelta}
          min={-0.2}
          max={0.3}
          step={0.01}
          onChange={setOccDelta}
          format={(n) => `${n >= 0 ? '+' : ''}${(n * 100).toFixed(0)}%`}
        />
        <Slider
          label="Days in month"
          value={nights}
          min={20}
          max={31}
          step={1}
          onChange={setNights}
          format={(n) => `${n} nights`}
        />
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        <Stat label="Modeled revenue" value={usd(result.revenue)} />
        <Stat label="vs. baseline" value={usd(result.delta)} sub={`${(result.deltaPct * 100).toFixed(1)}%`} highlight />
        <Stat label="Modeled ADR" value={usd(result.adr)} />
        <Stat label="Modeled occupancy" value={`${Math.round(result.occupancy * 100)}%`} />
      </div>

      {Number.isFinite(lastMonthRevenue) && lastMonthRevenue > 0 && (
        <p className="mt-4 text-xs text-brand-slate">
          Last month booked {usd(lastMonthRevenue)}. The lever above models a typical month
          (not event-window), driven by your stored base ADR + average occupancy.
        </p>
      )}
    </div>
  );
}

function Slider({ label, value, min, max, step, onChange, format }) {
  return (
    <label className="block">
      <div className="flex items-baseline justify-between">
        <span className="text-xs uppercase tracking-widest text-brand-slate/70">{label}</span>
        <span className="font-medium text-brand-ink tabular-nums">{format(value)}</span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="mt-2 w-full accent-brand-gold"
      />
    </label>
  );
}

function Stat({ label, value, sub, highlight = false }) {
  return (
    <div
      className={`rounded-xl border p-3 ${
        highlight ? 'border-brand-gold/40 bg-brand-gold/10' : 'border-brand-tan/60 bg-brand-sand/40'
      }`}
    >
      <p className="text-[10px] uppercase tracking-widest text-brand-slate/70">{label}</p>
      <p className={`display mt-1 text-xl ${highlight ? 'text-brand-gold' : 'text-brand-ink'}`}>{value}</p>
      {sub && <p className="text-xs text-brand-slate">{sub}</p>}
    </div>
  );
}
