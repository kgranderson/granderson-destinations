import 'server-only';
/**
 * Meta Graph / Instagram Business publisher.
 *
 * Uses the IG Business container-creation flow:
 *   POST /{ig-user-id}/media           → returns container_id
 *   POST /{ig-user-id}/media_publish   → publishes container_id
 *
 * Stub mode: enqueues the post to an in-memory queue so the
 * dashboard can render the calendar with realistic state.
 *
 * As of Phase C (2026-05-15) `publishImage` accepts optional per-property
 * credentials. When passed, these override the global env vars so each
 * property posts as its own IG Business account. The fall-through to
 * env vars keeps the legacy single-property flow working until every
 * property has been migrated.
 */
import { FEATURE_FLAGS } from '@/lib/constants';

const GRAPH = 'https://graph.facebook.com/v21.0';

const stubQueue = [];

export async function publishImage({
  imageUrl,
  caption,
  locationId,
  igBusinessId,
  accessToken,
}) {
  const igUser = igBusinessId || process.env.META_INSTAGRAM_BUSINESS_ID;
  const token = accessToken || process.env.META_LONG_LIVED_TOKEN;
  const haveCreds = !!(igUser && token);

  // Stub when we don't have creds — either the feature flag is off OR
  // we're being called for a property whose creds aren't set yet. This
  // lets the publish cron run safely in mixed-state portfolios (some
  // properties live, some pending Meta setup).
  if (!haveCreds || !FEATURE_FLAGS.metaIgLive()) {
    const id = `stub-${Date.now()}`;
    stubQueue.push({ id, imageUrl, caption, locationId, status: 'queued-stub', at: Date.now() });
    return { id, stub: true, status: 'queued-stub' };
  }

  // 1. Create container
  const containerRes = await fetch(`${GRAPH}/${igUser}/media`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      image_url: imageUrl,
      caption,
      location_id: locationId,
      access_token: token,
    }),
  });
  const containerJson = await containerRes.json();
  if (!containerRes.ok) {
    throw new Error(`IG container error: ${JSON.stringify(containerJson).slice(0, 500)}`);
  }

  // 2. Publish container
  const pubRes = await fetch(`${GRAPH}/${igUser}/media_publish`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ creation_id: containerJson.id, access_token: token }),
  });
  const pubJson = await pubRes.json();
  if (!pubRes.ok) {
    throw new Error(`IG publish error: ${JSON.stringify(pubJson).slice(0, 500)}`);
  }

  return { id: pubJson.id, stub: false, status: 'published' };
}

export function listStubQueue() {
  return [...stubQueue];
}
