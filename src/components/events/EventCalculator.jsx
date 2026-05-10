'use client';

import { useState } from 'react';
import { calcEventPremium } from '@/lib/events/premium';
import { usd } from '@/lib/utils/format';

/**
 * Interactive event premium calculator. Lets the user dial baseline
 * ADR + occupancy and see the projected event-window revenue lift.
 *
 * Pure client-side compute — no functions cross the boundary; the
 * `event` object is plain data.
 */
export function EventCalculator({ event, baseAdrUsd = 700 }) {
  const [adr, setAdr] = useState(baseAdrUsd);
  const [occ, setOcc] = useState(0.6);
  const [nights, setNights] = useState(event.minStayNights);

  const result = calcEventPremium({
    baseAdrUsd: adr,
    occupancyBaseline: occ,
    event,
    nights,
  });

  if (!result) return null;

  return (
    <div className="rounded-2xl border border-brand-tan/60 bg-brand-cloud p-6 shadow-soft sm:p-8">
      <p className="text-xs uppercase tracking-[0.24em] text-brand-slate/70">Premium calculator</p>
      <h3 className="display mt-2 text-2xl text-brand-ink">
        What this event is worth on your property.
      </h3>
      <p className="mt-2 text-sm text-brand-slate">
        Live model — drag the inputs to see how baseline ADR, occupancy, and length-of-stay translate
        into incremental revenue versus a non-event week.
      </p>

      <div className="mt-6 grid gap-5 md:grid-cols-3">
        <Slider
          label="Base ADR"
          value={adr}
          min={150}
          max={2400}
          step={10}
          onChange={setAdr}
          format={(n) => usd(n)}
        />
        <Slider
          label="Base occupancy"
          value={occ}
          min={0.3}
          max={0.95}
          step={0.01}
          onChange={setOcc}
          format={(n) => `${Math.round(n * 100)}%`}
        />
        <Slider
          label="Stay length"
          value={nights}
          min={event.minStayNights}
          max={Math.max(event.minStayNights + 4, 10)}
          step={1}
          onChange={setNights}
          format={(n) => `${n} nights`}
        />
      </div>

      <div className="mt-8 grid gap-3 sm:grid-cols-2">
        <Stat
          label="Recommended event ADR"
          value={usd(result.recommendedAdr)}
          sub={`vs. baseline ${usd(adr)}`}
        />
        <Stat
          label="Recommended occupancy"
          value={`${Math.round(result.recommendedOccupancy * 100)}%`}
          sub={`vs. baseline ${Math.round(occ * 100)}%`}
        />
        <Stat
          label="Event-window revenue"
          value={usd(result.eventRevenue)}
          sub={`baseline ${usd(result.baselineRevenue)}`}
        />
        <Stat
          label="Projected lift"
          value={usd(result.liftUsd)}
          sub={`+${Math.round(result.liftPct * 100)}% vs. baseline`}
          highlight
        />
      </div>
    </div>
  );
}

function Slider({ label, value, min, max, step, onChange, format }) {
  return (
    <label className="block">
      <div className="flex items-baseline justify-between">
        <span className="text-xs uppercase tracking-widest text-brand-slate/70">{label}</span>
        <span className="display text-lg text-brand-ink">{format(value)}</span>
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
      className={`rounded-xl border p-4 ${
        highlight ? 'border-brand-gold/40 bg-brand-gold/10' : 'border-brand-tan/60 bg-brand-sand/40'
      }`}
    >
      <p className="text-[10px] uppercase tracking-widest text-brand-slate/70">{label}</p>
      <p className={`display mt-1 text-2xl ${highlight ? 'text-brand-gold' : 'text-brand-ink'}`}>{value}</p>
      <p className="text-xs text-brand-slate">{sub}</p>
    </div>
  );
}
