'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { Container } from '@/components/shared/Container';
import { NavBar } from '@/components/shared/NavBar';
import { Footer } from '@/components/shared/Footer';

export default function RouteError({ error, reset }) {
  useEffect(() => {
    if (typeof console !== 'undefined') console.error(error);
  }, [error]);

  return (
    <>
      <NavBar />
      <main className="min-h-[70vh] pt-40">
        <Container size="md" className="text-center">
          <p className="text-xs uppercase tracking-[0.3em] text-brand-slate/70">
            Something didn’t go as planned
          </p>
          <h1 className="display mt-3 text-display-lg">We hit a snag.</h1>
          <p className="mt-3 text-brand-slate">
            Try the action again, or head back home.
          </p>
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
      <Footer />
    </>
  );
}
