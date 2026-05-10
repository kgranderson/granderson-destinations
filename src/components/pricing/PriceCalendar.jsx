'use client';

import { useMemo, useState } from 'react';
import { format, parseISO, addDays, startOfMonth, endOfMonth, getDay } from 'date-fns';
import { usd } from '@/lib/utils/format';

/**
 * 60-day forward price calendar. Heat-mapped by price tier with
 * an overlay marker for event-window dates.
 */
export function PriceCalendar({ prices = [], eventWindows = [], baseAdr }) {
  const [hover, setHover] = useState(null);

  // Index prices by date
  const byDate = useMemo(() => {
    const m = new Map();
    for (const p of prices) m.set(p.date, p);
    return m;
  }, [prices]);

  // Index event windows by date
  const eventsByDate = useMemo(() => {
    const m = new Map();
    for (const w of eventWindows) {
      const start = parseISO(w.startDate);
      const end = parseISO(w.endDate);
      for (let d = start; d <= end; d = addDays(d, 1)) {
        m.set(format(d, 'yyyy-MM-dd'), w);
      }
    }
    return m;
  }, [eventWindows]);

  // Empty-state guard before any quartile math
  if (!prices.length) {
    return (
      <div className="rounded-2xl border border-brand-tan/60 bg-brand-cloud p-5">
        <p className="text-sm text-brand-slate">No pricing data — wire PriceLabs to populate.</p>
      </div>
    );
  }

  // Compute price tier thresholds
  const sorted = prices.map((p) => p.price).sort((a, b) => a - b);
  const q33 = sorted[Math.floor(sorted.length * 0.33)];
  const q66 = sorted[Math.floor(sorted.length * 0.66)];

  const tier = (price) => {
    if (!price) return 'none';
    if (price >= q66) return 'high';
    if (price >= q33) return 'mid';
    return 'low';
  };

  const TIER_BG = {
    none: 'bg-brand-sand/30',
    low: 'bg-brand-sand',
    mid: 'bg-brand-tan',
    high: 'bg-brand-gold',
  };

  const firstDate = parseISO(prices[0].date);
  const lastDate = parseISO(prices[prices.length - 1].date);
  const months = [];
  let cursor = startOfMonth(firstDate);
  while (cursor <= lastDate) {
    months.push(new Date(cursor));
    cursor = addDays(endOfMonth(cursor), 1);
  }

  return (
    <div className="rounded-2xl border border-brand-tan/60 bg-brand-cloud p-5 shadow-soft">
      <div className="flex flex-wrap items-baseline justify-between gap-4">
        <div>
          <h3 className="display text-xl text-brand-ink">Forward pricing · 60 days</h3>
          <p className="mt-1 text-xs text-brand-slate">
            Base ADR {usd(baseAdr || 0)} · low/mid/high tiers split at $
            {Math.round(q33)} / ${Math.round(q66)}
          </p>
        </div>
        <Legend />
      </div>

      <div className="mt-5 space-y-6">
        {months.map((m) => (
          <MonthGrid
            key={m.toISOString()}
            month={m}
            byDate={byDate}
            eventsByDate={eventsByDate}
            tier={tier}
            tierBg={TIER_BG}
            onHover={setHover}
          />
        ))}
      </div>

      {hover && (
        <div className="mt-4 rounded-xl border border-brand-tan/60 bg-brand-sand/40 p-3 text-sm">
          <span className="font-medium text-brand-ink">{hover.date}</span> ·{' '}
          {hover.price ? <span>{usd(hover.price)} / night</span> : <span>no rate</span>}
          {hover.event && <span className="ml-2 text-brand-gold">· {hover.event.eventName}</span>}
          {hover.minStay > 1 && <span className="ml-2 text-brand-slate">· {hover.minStay}-night min</span>}
        </div>
      )}
    </div>
  );
}

function MonthGrid({ month, byDate, eventsByDate, tier, tierBg, onHover }) {
  const monthStart = startOfMonth(month);
  const monthEnd = endOfMonth(month);
  const monthLabel = format(month, 'MMMM yyyy');
  const startWeekday = getDay(monthStart);
  const totalDays = monthEnd.getDate();
  const cells = [];
  for (let i = 0; i < startWeekday; i++) cells.push({ pad: true, key: `pad-${i}` });
  for (let d = 1; d <= totalDays; d++) {
    const date = format(new Date(month.getFullYear(), month.getMonth(), d), 'yyyy-MM-dd');
    cells.push({ date, key: date });
  }

  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-widest text-brand-slate/70">{monthLabel}</p>
      <div className="mt-2 grid grid-cols-7 gap-1">
        {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map((d, i) => (
          <span key={`h-${i}`} className="text-center text-[10px] uppercase tracking-widest text-brand-slate/60">
            {d}
          </span>
        ))}
        {cells.map((c) =>
          c.pad ? (
            <span key={c.key} />
          ) : (
            <DayCell
              key={c.key}
              date={c.date}
              data={byDate.get(c.date)}
              event={eventsByDate.get(c.date)}
              tier={tier}
              tierBg={tierBg}
              onHover={onHover}
            />
          ),
        )}
      </div>
    </div>
  );
}

function DayCell({ date, data, event, tier, tierBg, onHover }) {
  const t = tier(data?.price);
  return (
    <button
      type="button"
      onMouseEnter={() =>
        onHover({ date, price: data?.price, event, minStay: data?.minStay ?? 1 })
      }
      onMouseLeave={() => onHover(null)}
      onFocus={() => onHover({ date, price: data?.price, event, minStay: data?.minStay ?? 1 })}
      onBlur={() => onHover(null)}
      className={`relative aspect-square rounded-md p-1 text-left transition-colors ${tierBg[t]} hover:ring-2 hover:ring-brand-ink`}
    >
      <span className="block text-[10px] text-brand-slate">{Number(date.slice(-2))}</span>
      {data?.price && (
        <span className="block text-[10px] font-medium text-brand-ink">${Math.round(data.price)}</span>
      )}
      {event && (
        <span aria-hidden className="absolute right-0.5 top-0.5 h-1.5 w-1.5 rounded-full bg-brand-terracotta" />
      )}
    </button>
  );
}

function Legend() {
  return (
    <div className="flex flex-wrap items-center gap-3 text-[10px] uppercase tracking-widest text-brand-slate/70">
      <Tier color="bg-brand-sand" label="Low" />
      <Tier color="bg-brand-tan" label="Mid" />
      <Tier color="bg-brand-gold" label="High" />
      <span className="inline-flex items-center gap-1">
        <span className="h-1.5 w-1.5 rounded-full bg-brand-terracotta" /> Event
      </span>
    </div>
  );
}

function Tier({ color, label }) {
  return (
    <span className="inline-flex items-center gap-1">
      <span className={`h-3 w-3 rounded-sm ${color}`} /> {label}
    </span>
  );
}
