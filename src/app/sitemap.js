import { PROPERTIES, ANCHOR_EVENTS_SEED, MARKETS } from '@/lib/constants';

export default function sitemap() {
  const base = process.env.NEXT_PUBLIC_SITE_URL || 'https://granderson-destinations.vercel.app';
  const now = new Date();
  // /auth/* excluded until the real sign-in flow ships in M7.
  const fixed = ['', '/destinations', '/experiences', '/events', '/intel', '/about', '/contact'];
  return [
    ...fixed.map((path) => ({ url: `${base}${path}`, lastModified: now, changeFrequency: 'weekly', priority: 0.7 })),
    ...PROPERTIES.map((p) => ({
      url: `${base}/destinations/${p.slug}`,
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 0.9,
    })),
    // Per-market experience guides — /experiences/<market>
    ...Object.keys(MARKETS).map((market) => ({
      url: `${base}/experiences/${market}`,
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 0.8,
    })),
    // Per-market events list — /events/<market>
    ...Object.keys(MARKETS).map((market) => ({
      url: `${base}/events/${market}`,
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 0.7,
    })),
    // Individual event detail pages — now nested as /events/<market>/<slug>
    ...ANCHOR_EVENTS_SEED.map((e) => ({
      url: `${base}/events/${e.market}/${e.slug}`,
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.6,
    })),
  ];
}
