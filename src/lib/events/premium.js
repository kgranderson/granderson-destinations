/**
 * Feature 3 — Event premium calculator.
 *
 * Given a base nightly rate and an anchor event, returns the
 * recommended event-window ADR + the projected revenue lift
 * relative to a baseline same-period booking.
 */
export function calcEventPremium({ baseAdrUsd, occupancyBaseline, event, nights }) {
  if (!event) return null;
  const recommendedAdr = +(baseAdrUsd * event.adrUpliftPct).toFixed(2);
  const recommendedOccupancy = Math.min(1, occupancyBaseline + event.occupancyUpliftPct);
  const eventRevenue = +(recommendedAdr * recommendedOccupancy * nights).toFixed(2);
  const baselineRevenue = +(baseAdrUsd * occupancyBaseline * nights).toFixed(2);
  const liftUsd = +(eventRevenue - baselineRevenue).toFixed(2);
  const liftPct = baselineRevenue > 0 ? liftUsd / baselineRevenue : 0;
  return {
    recommendedAdr,
    recommendedOccupancy,
    eventRevenue,
    baselineRevenue,
    liftUsd,
    liftPct,
    recommendedMinStay: event.minStayNights,
  };
}
