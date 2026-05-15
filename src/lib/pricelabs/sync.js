import 'server-only';
/**
 * Event-driven price sync for PriceLabs.
 *
 * For each anchor event in a property's market, computes the
 * recommended ADR override window using the same calc that drives
 * the public-facing event premium pages. Returns the overrides
 * payload (or pushes it via the PriceLabs API in live mode).
 */
import { ANCHOR_EVENTS_SEED } from '@/lib/constants';
import { calcEventPremium } from '@/lib/events/premium';
import { pushPriceOverrides } from './client';

/**
 * Build the event-driven PriceLabs override list for a property.
 *
 * Default behavior (no `window` opt): every anchor event in the
 * property's market whose start..end overlaps the next `lookaheadDays`.
 *
 * With `window: { startDate, endDate }` (ISO YYYY-MM-DD strings):
 * only events whose start..end OVERLAP that window. Phase B's quarter
 * view uses this so "Push to PriceLabs" scopes to the quarter the
 * operator is looking at — not the full 365-day lookahead — to avoid
 * silently overwriting far-future overrides outside the visible scope.
 */
export function buildEventOverrides({ property, lookaheadDays = 365, window } = {}) {
  const today = new Date();
  const cutoff = new Date(today.getTime() + lookaheadDays * 86400000);
  const defaultStartIso = today.toISOString().slice(0, 10);
  const defaultEndIso = cutoff.toISOString().slice(0, 10);

  const startIso = window?.startDate || defaultStartIso;
  const endIso = window?.endDate || defaultEndIso;

  const events = ANCHOR_EVENTS_SEED.filter(
    (e) =>
      e.market === property.slug &&
      e.endDate >= startIso &&
      e.startDate <= endIso,
  ).sort((a, b) => a.startDate.localeCompare(b.startDate));

  const overrides = events.map((e) => {
    const premium = calcEventPremium({
      baseAdrUsd: property.baseAdrUsd ?? 600,
      occupancyBaseline: 0.6,
      event: e,
      nights: e.minStayNights,
    });
    return {
      eventSlug: e.slug,
      eventName: e.name,
      startDate: e.startDate,
      endDate: e.endDate,
      basePrice: property.baseAdrUsd ?? 600,
      recommendedPrice: premium.recommendedAdr,
      minStayNights: e.minStayNights,
      adrUpliftPct: e.adrUpliftPct,
    };
  });

  return overrides;
}

export async function syncEventOverrides({ property, window } = {}) {
  const overrides = buildEventOverrides({ property, window });
  // Real PriceLabs override payload format
  const payload = overrides.map((o) => ({
    start_date: o.startDate,
    end_date: o.endDate,
    price: o.recommendedPrice,
    min_stay: o.minStayNights,
    note: o.eventName,
  }));
  if (!property.pricelabsListingId) {
    return { pushed: 0, stub: true, overrides, reason: 'no listing id' };
  }
  const res = await pushPriceOverrides({
    listingId: property.pricelabsListingId,
    overrides: payload,
  });
  return {
    pushed: payload.length,
    stub: !!res?.stub,
    overrides,
    response: res,
  };
}
