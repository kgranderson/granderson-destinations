'use client';

import { useMemo, useState } from 'react';
import { ANCHOR_EVENTS_SEED, BOOKING, BRAND } from '@/lib/constants';
import { usd } from '@/lib/utils/format';

/**
 * Sticky booking widget. In stub mode (no Stripe) the "Reserve"
 * button just opens an outreach mail-to. The full Stripe-deposit
 * flow lands in M2 follow-up.
 */
export function BookingWidget({ property }) {
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(today.getDate() + 1);
  const fmt = (d) => d.toISOString().slice(0, 10);

  const [start, setStart] = useState(fmt(today));
  const [end, setEnd] = useState(fmt(new Date(today.getTime() + 86400000 * 3)));
  const [guests, setGuests] = useState(2);

  const nights = Math.max(0, Math.round((new Date(end) - new Date(start)) / 86400000));
  const baseAdr = property.baseAdrUsd ?? 600;

  // Detect if the requested window overlaps a known anchor event in this market.
  const eventOverlap = useMemo(() => {
    const s = start;
    const e = end;
    return ANCHOR_EVENTS_SEED.find(
      (ev) =>
        ev.market === property.slug &&
        !(ev.endDate < s || ev.startDate > e),
    );
  }, [start, end, property.slug]);

  const adr = eventOverlap ? Math.round(baseAdr * eventOverlap.adrUpliftPct) : baseAdr;
  const subtotal = adr * nights;
  const cleaning = 350;
  const taxes = Math.round(subtotal * 0.115);
  const total = subtotal + cleaning + taxes;
  const deposit = Math.round(total * BOOKING.depositPercent);

  const minNightsRequired = eventOverlap
    ? eventOverlap.minStayNights
    : BOOKING.minNights.default;
  const meetsMinStay = nights >= minNightsRequired;

  return (
    <aside className="rounded-2xl border border-brand-tan/60 bg-brand-cloud p-6 shadow-lift">
      <p className="text-xs uppercase tracking-[0.24em] text-brand-slate/70">From</p>
      <div className="mt-1 flex items-baseline gap-2">
        <span className="display text-3xl text-brand-ink">{usd(adr)}</span>
        <span className="text-sm text-brand-slate">/ night</span>
        {eventOverlap && (
          <span className="ml-auto rounded-full bg-brand-gold/15 px-2 py-0.5 text-[10px] uppercase tracking-widest text-brand-gold">
            {eventOverlap.name.split(' — ')[0]}
          </span>
        )}
      </div>

      <div className="mt-5 grid grid-cols-2 gap-3">
        <Field label="Check in">
          <input
            type="date"
            value={start}
            min={fmt(today)}
            onChange={(e) => setStart(e.target.value)}
            className="w-full bg-transparent text-sm text-brand-ink outline-none"
          />
        </Field>
        <Field label="Check out">
          <input
            type="date"
            value={end}
            min={start}
            onChange={(e) => setEnd(e.target.value)}
            className="w-full bg-transparent text-sm text-brand-ink outline-none"
          />
        </Field>
      </div>
      <Field label="Guests" className="mt-3">
        <select
          value={guests}
          onChange={(e) => setGuests(Number(e.target.value))}
          className="w-full bg-transparent text-sm text-brand-ink outline-none"
        >
          {Array.from({ length: property.sleeps || 8 }, (_, i) => i + 1).map((n) => (
            <option key={n} value={n}>
              {n} {n === 1 ? 'guest' : 'guests'}
            </option>
          ))}
        </select>
      </Field>

      <dl className="mt-6 space-y-2 text-sm">
        <Line k={`${usd(adr)} × ${nights} nights`} v={usd(subtotal)} />
        <Line k="Cleaning" v={usd(cleaning)} />
        <Line k="Taxes & fees" v={usd(taxes)} />
        <div className="my-3 h-px bg-brand-tan/60" />
        <Line k={<span className="font-medium">Total</span>} v={<span className="font-medium">{usd(total)}</span>} />
        <Line k={`Deposit (${Math.round(BOOKING.depositPercent * 100)}%)`} v={usd(deposit)} highlight />
      </dl>

      {!meetsMinStay && (
        <p className="mt-4 rounded-md bg-brand-terracotta/10 px-3 py-2 text-xs text-brand-terracotta">
          {eventOverlap
            ? `${eventOverlap.name.split(' — ')[0]} requires a ${minNightsRequired}-night minimum.`
            : `Minimum stay is ${minNightsRequired} nights.`}
        </p>
      )}

      <a
        href={`mailto:${BRAND.bookingEmail}?subject=Reservation%20inquiry%20—%20${encodeURIComponent(property.name)}&body=${encodeURIComponent(
          `Hi — I'd like to reserve ${property.name} from ${start} to ${end} for ${guests} guests.\n\nQuoted total: ${usd(total)}\nDeposit: ${usd(deposit)}`,
        )}`}
        className={`mt-5 block w-full rounded-full px-5 py-3 text-center text-sm font-medium transition-colors ${
          meetsMinStay
            ? 'bg-brand-ink text-brand-cloud hover:bg-brand-slate'
            : 'cursor-not-allowed bg-brand-tan/60 text-brand-slate'
        }`}
      >
        {meetsMinStay ? 'Request reservation' : `Adjust dates to ${minNightsRequired}+ nights`}
      </a>

      <p className="mt-3 text-center text-[11px] text-brand-slate/70">
        No charge yet · concierge replies within an hour during business hours.
      </p>
    </aside>
  );
}

function Field({ label, children, className = '' }) {
  return (
    <label className={`block rounded-xl border border-brand-tan/60 bg-brand-sand/30 px-3 py-2 ${className}`}>
      <span className="block text-[10px] uppercase tracking-widest text-brand-slate/70">{label}</span>
      <span className="mt-0.5 block">{children}</span>
    </label>
  );
}

function Line({ k, v, highlight = false }) {
  return (
    <div className={`flex items-center justify-between ${highlight ? 'text-brand-gold' : 'text-brand-slate'}`}>
      <dt>{k}</dt>
      <dd>{v}</dd>
    </div>
  );
}
