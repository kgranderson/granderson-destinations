/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  images: {
    formats: ['image/avif', 'image/webp'],
    remotePatterns: [
      { protocol: 'https', hostname: 'destinationgh.com' },
      { protocol: 'https', hostname: 'www.destinationgh.com' },
      { protocol: 'https', hostname: 'images.unsplash.com' },
      { protocol: 'https', hostname: 'maps.googleapis.com' },
      { protocol: 'https', hostname: 'lh3.googleusercontent.com' },
      { protocol: 'https', hostname: 'scontent.cdninstagram.com' },
      { protocol: 'https', hostname: '*.supabase.co' },
    ],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
  },
  experimental: {
    optimizePackageImports: ['lucide-react', 'framer-motion'],
  },
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
          { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },
        ],
      },
    ];
  },
  // Backward-compat 301s for the Phase 0 URL consolidation (2026-05-15).
  // /maintenance/* admin URLs moved under /admin/*; /api/maintenance/* admin
  // routes moved under /api/admin/*. Guest-facing /maintenance/{status,
  // vendor,report,qr-card}/* stay where they are.
  async redirects() {
    return [
      // Page redirects — exact root first, then nested
      { source: '/maintenance/admin', destination: '/admin', permanent: true },
      { source: '/maintenance/admin/:slug*', destination: '/admin/:slug*', permanent: true },
      // API redirects (308 to preserve method + body on POST/PATCH/DELETE)
      { source: '/api/maintenance/admin/:slug*', destination: '/api/admin/:slug*', permanent: true },
    ];
  },
};

module.exports = nextConfig;
