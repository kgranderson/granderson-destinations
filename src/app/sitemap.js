import { PROPERTIES } from '@/lib/constants';

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
  ];
}
