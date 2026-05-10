import { NextResponse } from 'next/server';

/**
 * Stripe webhook — full implementation lands in M2 (booking flow).
 *
 * The complete handler will:
 *   1. Verify Stripe signature (STRIPE_WEBHOOK_SECRET)
 *   2. Check stripe_events table for idempotency
 *   3. Handle: checkout.session.completed,
 *              payment_intent.succeeded,
 *              payment_intent.payment_failed
 *   4. Mutate bookings via getAdminClient()
 */
export async function POST(request) {
  return NextResponse.json({ ok: true, stub: true, ms: 'M2-pending' }, { status: 200 });
}
