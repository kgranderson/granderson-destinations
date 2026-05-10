import { NextResponse } from 'next/server';
import { FEATURE_FLAGS } from '@/lib/constants';

/**
 * Proxies a Google Place Photo request so we don't expose the API key
 * in <img src>. Caches at the CDN edge for 7 days.
 */
export async function GET(request) {
  const url = new URL(request.url);
  const ref = url.searchParams.get('ref');
  const maxWidth = url.searchParams.get('w') || '1200';

  if (!FEATURE_FLAGS.googlePlacesLive() || !ref) {
    return new NextResponse(null, { status: 404 });
  }

  const upstream = `https://maps.googleapis.com/maps/api/place/photo?photoreference=${encodeURIComponent(
    ref,
  )}&maxwidth=${maxWidth}&key=${process.env.GOOGLE_PLACES_API_KEY}`;

  // Google returns a 302 to googleusercontent — follow and stream back.
  const res = await fetch(upstream, { redirect: 'follow' });
  if (!res.ok) return new NextResponse(null, { status: res.status });

  const headers = new Headers();
  headers.set('Content-Type', res.headers.get('Content-Type') || 'image/jpeg');
  headers.set('Cache-Control', 'public, max-age=604800, s-maxage=2592000, immutable');
  return new NextResponse(res.body, { status: 200, headers });
}
