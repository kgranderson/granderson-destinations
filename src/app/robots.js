export default function robots() {
  const base = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.grandersondestinations.com';
  return {
    rules: [
      { userAgent: '*', allow: '/', disallow: ['/api/', '/admin/', '/economics', '/pricing-engine', '/social', '/auth/callback', '/maintenance/vendor/', '/maintenance/status/'] },
    ],
    sitemap: `${base}/sitemap.xml`,
  };
}

