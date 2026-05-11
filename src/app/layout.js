import './globals.css';
import { BRAND } from '@/lib/constants';

export const metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || 'https://granderson-destinations.vercel.app'),
  title: {
    default: `${BRAND.name} · Curated luxury stays`,
    template: `%s · ${BRAND.name}`,
  },
  description: BRAND.description,
  applicationName: BRAND.name,
  authors: [{ name: BRAND.founderName }],
  keywords: [
    'Palm Springs villa',
    'San Miguel de Allende rental',
    'midcentury modern',
    'colonial estate',
    'Granderson Destinations',
  ],
  openGraph: {
    type: 'website',
    siteName: BRAND.name,
    title: `${BRAND.name} · Curated luxury stays`,
    description: BRAND.description,
    images: [{ url: '/og/default.jpg', width: 1200, height: 630 }],
  },
  twitter: {
    card: 'summary_large_image',
    title: BRAND.name,
    description: BRAND.description,
    images: ['/og/default.jpg'],
  },
  robots: { index: true, follow: true },
  icons: {
    icon: [
      { url: '/logo/favicon.svg', type: 'image/svg+xml' },
      { url: '/favicon.ico' },
    ],
    apple: '/logo/apple-touch-icon.png',
  },
};

export const viewport = {
  themeColor: '#0E1116',
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* Brand typography: Cormorant Garamond + Cormorant SC + Inter */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,500;1,300;1,400&family=Cormorant+SC:wght@300;400&family=Inter:wght@300;400;500;600&display=swap"
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
