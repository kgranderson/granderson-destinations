import { NextResponse } from 'next/server';

/**
 * Stripe webhook — full implementation lands in a follow-up milestone.
 *
 * IMPORTANT: returns 501 (not 200) so that if STRIPE_WEBHOOK_SECRET is
 * configured prematurely, Stripe's retry behavior keeps the events alive
 * until the real handler ships. Returning 2xx would silently swallow
 * payment events.
 *
 * Full handler will:
 *   1. Verify Stripe signature (STRIPE_WEBHOOK_SECRET)
 *   2. Check stripe_events table for idempotency
 *   3. Handle: checkout.session.completed,
 *              payment_intent.succeeded,
 *              payment_intent.payment_failed
 *   4. Mutate bookings via getAdminClient()
 */
export async function POST() {
  return NextResponse.json(
    { error: 'stripe webhook not yet implemented', stub: true },
    { status: 501 },
  );
}
