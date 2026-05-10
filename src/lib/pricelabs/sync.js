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

export function buildEventOverrides({ property, lookaheadDays = 365 }) {
  const today = new Date();
  const cutoff = new Date(today.getTime() + lookaheadDays * 86400000);
  const todayIso = today.toISOString().slice(0, 10);
  const cutoffIso = cutoff.toISOString().slice(0, 10);

  const events = ANCHOR_EVENTS_SEED.filter(
    (e) =>
      e.market === property.slug &&
      e.endDate >= todayIso &&
      e.startDate <= cutoffIso,
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

export async function syncEventOverrides({ property }) {
  const overrides = buildEventOverrides({ property });
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
