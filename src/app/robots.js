export default function robots() {
  const base = process.env.NEXT_PUBLIC_SITE_URL || 'https://granderson-destinations.vercel.app';
  return {
    rules: [
      { userAgent: '*', allow: '/', disallow: ['/api/', '/auth/callback'] },
    ],
    sitemap: `${base}/sitemap.xml`,
  };
}
