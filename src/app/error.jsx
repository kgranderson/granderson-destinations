'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { Container } from '@/components/shared/Container';

export default function GlobalError({ error, reset }) {
  useEffect(() => {
    // Telemetry hook — wire to Sentry/PostHog when configured.
    if (typeof console !== 'undefined') console.error(error);
  }, [error]);

  return (
    <html lang="en">
      <body className="bg-brand-cloud text-brand-ink">
        <main className="min-h-[80vh] pt-40">
          <Container size="md" className="text-center">
            <p className="text-xs uppercase tracking-[0.3em] text-brand-slate/70">
              Something didn’t go as planned
            </p>
            <h1 className="display mt-3 text-display-lg">
              We hit a snag. Try again, or head back home.
            </h1>
            <div className="mt-8 flex justify-center gap-4">
              <button
                onClick={() => reset()}
                className="rounded-full bg-brand-ink px-6 py-3 text-sm text-brand-cloud"
              >
                Retry
              </button>
              <Link
                href="/"
                className="rounded-full border border-brand-ink px-6 py-3 text-sm"
              >
                Go home
              </Link>
            </div>
            {process.env.NEXT_PUBLIC_DEMO_MODE === 'true' && (
              <pre className="mx-auto mt-10 max-w-2xl overflow-auto rounded-md bg-brand-ink/5 p-4 text-left text-xs">
                {error?.message}
              </pre>
            )}
          </Container>
        </main>
      </body>
    </html>
  );
}
