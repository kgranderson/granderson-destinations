/**
 * Meta Graph / Instagram Business publisher (Feature 4).
 *
 * Uses the IG Business container-creation flow:
 *   POST /{ig-user-id}/media           → returns container_id
 *   POST /{ig-user-id}/media_publish   → publishes container_id
 *
 * Stub mode: enqueues the post to an in-memory queue so the
 * dashboard can render the calendar with realistic state.
 */
import { FEATURE_FLAGS } from '@/lib/constants';

const GRAPH = 'https://graph.facebook.com/v21.0';

const stubQueue = [];

export async function publishImage({ imageUrl, caption, locationId }) {
  if (!FEATURE_FLAGS.metaIgLive()) {
    const id = `stub-${Date.now()}`;
    stubQueue.push({ id, imageUrl, caption, locationId, status: 'queued-stub', at: Date.now() });
    return { id, stub: true, status: 'queued-stub' };
  }

  const igUser = process.env.META_INSTAGRAM_BUSINESS_ID;
  const token = process.env.META_LONG_LIVED_TOKEN;

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
  if (!containerRes.ok) throw new Error(`IG container error: ${JSON.stringify(containerJson)}`);

  // 2. Publish container
  const pubRes = await fetch(`${GRAPH}/${igUser}/media_publish`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ creation_id: containerJson.id, access_token: token }),
  });
  const pubJson = await pubRes.json();
  if (!pubRes.ok) throw new Error(`IG publish error: ${JSON.stringify(pubJson)}`);

  return { id: pubJson.id, stub: false, status: 'published' };
}

export function listStubQueue() {
  return [...stubQueue];
}
