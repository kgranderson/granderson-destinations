import { PROPERTIES, ANCHOR_EVENTS_SEED, MARKETS } from '@/lib/constants';

export default function sitemap() {
  const base = process.env.NEXT_PUBLIC_SITE_URL || 'https://granderson-destinations.vercel.app';
  const now = new Date();
  const fixed = ['', '/destinations', '/events', '/intel', '/about', '/contact', '/auth/login', '/auth/signup'];
  return [
    ...fixed.map((path) => ({ url: `${base}${path}`, lastModified: now, changeFrequency: 'weekly', priority: 0.7 })),
    ...PROPERTIES.map((p) => ({
      url: `${base}/destinations/${p.slug}`,
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 0.9,
    })),
    ...Object.keys(MARKETS).map((city) => ({
      url: `${base}/experiences/${city}`,
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 0.8,
    })),
    ...ANCHOR_EVENTS_SEED.map((e) => ({
      url: `${base}/events/${e.slug}`,
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.6,
    })),
  ];
}
