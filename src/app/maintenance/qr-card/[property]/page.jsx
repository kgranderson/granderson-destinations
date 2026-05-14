import { notFound } from 'next/navigation';
import { PROPERTIES, BRAND } from '@/lib/constants';

export const metadata = {
  title: 'Maintenance QR card',
  robots: { index: false, follow: false }, // don't index print pages
};

/**
 * Printable QR card for a single property. Renders a clean, brand-aligned
 * 5×7 card guests can scan to report a maintenance issue.
 *
 * Usage:
 *   /maintenance/qr-card/palm-springs            — letter-size single card
 *   /maintenance/qr-card/palm-springs?size=4x6   — postcard
 *   /maintenance/qr-card/palm-springs?size=8.5x11 — full sheet
 *
 * To save: open page → browser File → Print → "Save as PDF" → insert into
 * the welcome book PDF in Acrobat/Canva, or print directly.
 */
export default async function QrCardPage({ params, searchParams }) {
  const { property: slug } = await params;
  const sp = (await searchParams) || {};
  const property = PROPERTIES.find((p) => p.slug === slug);
  if (!property) notFound();

  // Build the URL the QR will resolve to.
  // Hard-code the production host so QR cards always point to the live site
  // even when generated from a localhost preview.
  const host = process.env.NEXT_PUBLIC_SITE_URL || 'https://granderson-destinations.vercel.app';
  const targetUrl = `${host}/maintenance/report?property=${property.slug}`;

  // qr-server.com is a free public QR API — encodes the URL into a PNG.
  // Size kept generous so it prints crisply.
  const qrSize = 720;
  const qrSrc = `https://api.qrserver.com/v1/create-qr-code/?data=${encodeURIComponent(targetUrl)}&size=${qrSize}x${qrSize}&margin=8&qzone=1&format=png&color=0E1116&bgcolor=F5EFE6`;

  // Format the card: 5×7 by default, 4×6 or 8.5×11 via ?size=
  const size = sp.size || '5x7';
  const cardWidthIn = size === '4x6' ? 4 : size === '8.5x11' ? 8.5 : 5;
  const cardHeightIn = size === '4x6' ? 6 : size === '8.5x11' ? 11 : 7;

  return (
    <>
      {/* Print-only styles: hide everything but the card, no margins around it. */}
      <style>{`
        @page { size: ${cardWidthIn}in ${cardHeightIn}in; margin: 0; }
        @media print {
          body { margin: 0; padding: 0; background: white; }
          .no-print { display: none !important; }
          .qr-card { box-shadow: none !important; border: none !important; page-break-inside: avoid; }
        }
        body { background: #E8DCC6; }
      `}</style>

      <main className="min-h-screen flex flex-col items-center justify-center p-8">
        <div className="no-print mb-6 max-w-2xl text-center text-sm text-brand-slate">
          <p className="font-medium text-brand-ink">Print preview · {property.name}</p>
          <p className="mt-1">
            File → Print → choose <strong>Save as PDF</strong> for an insert-into-welcome-book
            page, or print directly on cardstock and laminate for the kitchen counter.
          </p>
          <p className="mt-2 text-xs">
            Size: <code>{cardWidthIn}×{cardHeightIn}″</code> — change with{' '}
            <code>?size=4x6</code> or <code>?size=8.5x11</code>.
          </p>
        </div>

        <article
          className="qr-card flex flex-col items-center justify-between bg-brand-cloud text-brand-ink"
          style={{
            width: `${cardWidthIn}in`,
            height: `${cardHeightIn}in`,
            padding: '0.6in 0.55in',
            boxShadow: '0 24px 60px rgba(14,17,22,0.18)',
            border: '1px solid rgba(14,17,22,0.08)',
            fontFamily: '"Geist", system-ui, sans-serif',
          }}
        >
          {/* Top: brand mark + property */}
          <header className="w-full text-center">
            <div
              style={{
                fontFamily: '"Fraunces", "Cormorant Garamond", serif',
                fontSize: cardWidthIn >= 8 ? '1.5rem' : '1.05rem',
                letterSpacing: '0.02em',
                color: '#0E1116',
              }}
            >
              Granderson Destinations
            </div>
            <div
              style={{
                fontSize: '0.65rem',
                letterSpacing: '0.32em',
                textTransform: 'uppercase',
                marginTop: '0.25rem',
                color: '#3F4A56',
              }}
            >
              {property.name} · {property.city}
            </div>
          </header>

          {/* Middle: headline + QR */}
          <div className="flex flex-col items-center text-center" style={{ marginTop: '0.4in' }}>
            <h1
              style={{
                fontFamily: '"Fraunces", "Cormorant Garamond", serif',
                fontSize: cardWidthIn >= 8 ? '4.5rem' : cardWidthIn >= 5 ? '2.6rem' : '2rem',
                lineHeight: 1.05,
                letterSpacing: '-0.01em',
                color: '#0E1116',
                maxWidth: '90%',
              }}
            >
              Something not working?
            </h1>
            <p
              style={{
                marginTop: '0.55rem',
                fontSize: cardWidthIn >= 8 ? '1.05rem' : '0.85rem',
                color: '#3F4A56',
                maxWidth: '85%',
                lineHeight: 1.5,
              }}
            >
              Scan to send us a maintenance request. We triage in minutes and dispatch a
              vendor directly. No phone tag.
            </p>

            <img
              src={qrSrc}
              alt={`Scan to report a maintenance issue at ${property.name}`}
              width={qrSize}
              height={qrSize}
              style={{
                marginTop: '0.45in',
                width: cardWidthIn >= 8 ? '4in' : cardWidthIn >= 5 ? '2.6in' : '2.2in',
                height: 'auto',
                borderRadius: '0.25rem',
                boxShadow: '0 4px 14px rgba(14,17,22,0.10)',
              }}
            />

            <div
              style={{
                marginTop: '0.35in',
                fontSize: '0.7rem',
                letterSpacing: '0.18em',
                textTransform: 'uppercase',
                color: '#3F4A56',
              }}
            >
              Or visit
            </div>
            <div
              style={{
                fontSize: cardWidthIn >= 8 ? '0.95rem' : '0.72rem',
                color: '#0E1116',
                fontFamily: '"Geist Mono", ui-monospace, monospace',
                marginTop: '0.15rem',
                wordBreak: 'break-all',
                maxWidth: '92%',
                lineHeight: 1.3,
              }}
            >
              {targetUrl.replace(/^https?:\/\//, '')}
            </div>
          </div>

          {/* Bottom: emergency note */}
          <footer
            className="w-full text-center"
            style={{
              borderTop: '1px solid rgba(14,17,22,0.12)',
              paddingTop: '0.45in',
              fontSize: '0.7rem',
              color: '#3F4A56',
              lineHeight: 1.5,
            }}
          >
            <div style={{ letterSpacing: '0.2em', textTransform: 'uppercase' }}>Emergencies</div>
            <div style={{ marginTop: '0.25rem', color: '#0E1116' }}>
              For gas, fire, flood, or no-power situations,{' '}
              {BRAND.phone ? `call ${BRAND.phone}` : 'see the welcome book for the after-hours number'}
              .
            </div>
          </footer>
        </article>

        <div className="no-print mt-6 max-w-2xl text-center text-xs text-brand-slate/80">
          <p>
            QR encodes <code>{targetUrl}</code>. Test by scanning with your phone before printing.
          </p>
        </div>
      </main>
    </>
  );
}

export function generateStaticParams() {
  return PROPERTIES.map((p) => ({ property: p.slug }));
}
