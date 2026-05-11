import { NextResponse } from 'next/server';
import { FEATURE_FLAGS } from '@/lib/constants';

/**
 * Proxies a Google Place Photo request (NEW Places API) so we don't
 * expose the API key in <img src>. Caches at the CDN edge for 7 days.
 *
 * The "photo name" is the full resource path returned by Place
 * Details, e.g. "places/{place_id}/photos/{photo_id}".
 */
export async function GET(request) {
  const url = new URL(request.url);
  const name = url.searchParams.get('name');
  const maxWidth = url.searchParams.get('w') || '1200';

  if (!FEATURE_FLAGS.googlePlacesLive() || !name) {
    return new NextResponse(null, { status: 404 });
  }

  // Places API (New): GET https://places.googleapis.com/v1/{name}/media?maxWidthPx=N
  // Auth via X-Goog-Api-Key header. Returns a binary image stream.
  const upstream = `https://places.googleapis.com/v1/${encodeURI(name)}/media?maxWidthPx=${maxWidth}`;

  let res;
  try {
    res = await fetch(upstream, {
      headers: { 'X-Goog-Api-Key': process.env.GOOGLE_PLACES_API_KEY },
      redirect: 'follow',
    });
  } catch {
    return new NextResponse(null, { status: 502 });
  }
  if (!res.ok) return new NextResponse(null, { status: res.status });

  const headers = new Headers();
  headers.set('Content-Type', res.headers.get('Content-Type') || 'image/jpeg');
  headers.set('Cache-Control', 'public, max-age=604800, s-maxage=2592000, immutable');
  return new NextResponse(res.body, { status: 200, headers });
}
