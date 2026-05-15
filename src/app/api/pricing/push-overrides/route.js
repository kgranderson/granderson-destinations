import { NextResponse } from 'next/server';
import { syncEventOverrides } from '@/lib/pricelabs/sync';
import { pushPriceOverrides, listListings } from '@/lib/pricelabs/client';
import { PROPERTIES } from '@/lib/constants';
import { withAdmin } from '@/lib/auth/admin';

const SUPPORTED_CURRENCIES = new Set(['USD']);
const MAX_FORWARD_DAYS = 400; // ~1 yr + 1 month buffer
const MAX_PRICE = 100_000;

/**
 * Push PriceLabs overrides for a property. Two call modes:
 *
 *  1. Event-driven sync (no `overrides` in body):
 *       { propertySlug }
 *     Builds the recommended ADR uplift for every anchor event in the
 *     property's market and pushes them en masse via syncEventOverrides.
 *
 *  2. Operator-edited per-day overrides (`overrides` array in body):
 *       { propertySlug, listingId, overrides: [{date, price, currency}] }
 *     Used by /admin/marketing/[property]/pricing's PricingCockpit when
 *     the operator hand-edits days in the grid. Strict server-side
 *     validation rejects junk before any API call.
 *
 * Returns explicit `failed: true` (not silent stub-mode success) when
 * the live PriceLabs API rejects the push, so the cockpit can surface
 * the real error to the operator.
 */
export const POST = withAdmin(async (request) => {
  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: 'bad json' }, { status: 400 });
  }
  const { propertySlug, listingId, overrides } = body || {};
  const property = PROPERTIES.find((p) => p.slug === propertySlug);
  if (!property) {
    return NextResponse.json({ ok: false, error: 'unknown property' }, { status: 400 });
  }

  try {
    // Mode 2: operator-edited overrides
    if (Array.isArray(overrides) && overrides.length > 0) {
      if (!listingId || typeof listingId !== 'string') {
        return NextResponse.json(
          { ok: false, error: 'listingId is required for operator-mode push' },
          { status: 400 },
        );
      }

      // Cross-validate: the listingId must actually belong to a known
      // PriceLabs listing. Prevents a malicious or buggy caller from
      // shipping overrides to someone else's listing.
      // listListings() distinguishes "API down" (failed: true) from
      // "valid response that doesn't include this listing" — we MUST
      // return 502 on the former, not the misleading 400 "not in account".
      const listingsResult = await listListings();
      if (listingsResult.failed) {
        return NextResponse.json(
          {
            ok: false,
            error: 'PriceLabs API unreachable — could not verify listing',
            detail: listingsResult.error,
          },
          { status: 502 },
        );
      }
      const listingExists = listingsResult.listings.some((l) => l.listing_id === listingId);
      if (!listingExists) {
        return NextResponse.json(
          { ok: false, error: `listing ${listingId} not in PriceLabs account` },
          { status: 400 },
        );
      }

      // Server-side re-validate each override row. Date must be a valid
      // ISO calendar date in the next 400 days; price must be a positive
      // integer dollars amount <= MAX_PRICE; currency must be supported.
      const today = new Date();
      today.setUTCHours(0, 0, 0, 0);
      const todayMs = today.getTime();
      const horizonMs = todayMs + MAX_FORWARD_DAYS * 86_400_000;

      const cleaned = [];
      const rejected = [];
      for (const o of overrides) {
        const date = String(o?.date || '');
        const price = Number(o?.price);
        const currency = String(o?.currency || 'USD').toUpperCase();
        const reasons = [];

        // Strict ISO calendar check — regex AND a valid Date parse
        if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
          reasons.push('invalid date format');
        } else {
          const parsed = new Date(`${date}T00:00:00Z`);
          if (Number.isNaN(parsed.getTime())) reasons.push('unparseable date');
          else if (parsed.getTime() < todayMs) reasons.push('past date');
          else if (parsed.getTime() > horizonMs) reasons.push(`>${MAX_FORWARD_DAYS}d in future`);
        }
        if (!Number.isFinite(price) || price <= 0) reasons.push('invalid price');
        else if (price > MAX_PRICE) reasons.push(`price exceeds ${MAX_PRICE}`);
        if (!SUPPORTED_CURRENCIES.has(currency)) reasons.push(`unsupported currency ${currency}`);

        if (reasons.length === 0) {
          cleaned.push({
            date,
            price: Math.round(price),
            currency,
            source: 'cockpit',
          });
        } else {
          rejected.push({ date, price, reasons });
        }
      }

      if (cleaned.length === 0) {
        return NextResponse.json(
          {
            ok: false,
            error: 'no valid overrides after validation',
            rejected: rejected.slice(0, 25),
          },
          { status: 400 },
        );
      }

      const result = await pushPriceOverrides({ listingId, overrides: cleaned });

      // Distinguish: real failure vs intentional stub-mode no-op
      if (result?.failed) {
        return NextResponse.json(
          {
            ok: false,
            mode: 'operator',
            error: result.error || 'PriceLabs rejected the push',
            status: result.status,
          },
          { status: 502 },
        );
      }

      return NextResponse.json({
        ok: true,
        mode: 'operator',
        pushed: cleaned.length,
        rejected: rejected.length > 0 ? rejected.slice(0, 25) : undefined,
        stub: !!result?.stub,
      });
    }

    // Mode 1: event-driven sync (legacy callers + Phase B quarter view).
    // Optional body.window = { startDate, endDate } narrows the sync
    // to events whose start..end overlap that range — the quarter view
    // uses this so "Push to PriceLabs" doesn't silently overwrite far-
    // future overrides outside the quarter the operator is looking at.
    const win = body?.window;
    if (win && (typeof win.startDate !== 'string' || typeof win.endDate !== 'string')) {
      return NextResponse.json(
        { ok: false, error: 'window must be { startDate, endDate } ISO strings' },
        { status: 400 },
      );
    }
    const result = await syncEventOverrides({ property, window: win });
    return NextResponse.json({ ok: true, mode: 'event-sync', ...result });
  } catch (err) {
    return NextResponse.json(
      { ok: false, error: String(err?.message || err) },
      { status: 500 },
    );
  }
});
