import Link from 'next/link';
import { Container } from '../shared/Container';
import { MagneticButton } from '../shared/MagneticButton';

export function LandingHero() {
  return (
    <section className="relative isolate overflow-hidden bg-brand-ink text-brand-cloud">
      {/* Background gradient (image replaces this once destinationgh scrape lands) */}
      <div
        aria-hidden
        className="absolute inset-0 -z-10 bg-[radial-gradient(140%_90%_at_20%_10%,#3F4A56_0%,#0E1116_55%,#0E1116_100%)]"
      />
      <div
        aria-hidden
        className="absolute inset-x-0 bottom-0 -z-10 h-1/2 bg-gradient-to-t from-brand-ink to-transparent"
      />

      <Container className="relative flex min-h-[88vh] flex-col justify-end pb-24 pt-40 lg:min-h-[92vh]">
        <p className="text-xs uppercase tracking-[0.32em] text-brand-cloud/70">A private portfolio</p>
        <h1 className="display mt-5 max-w-4xl text-display-xl text-brand-cloud">
          Curated luxury stays in the world&rsquo;s most magnetic destinations.
        </h1>
        <p className="mt-6 max-w-2xl text-base leading-relaxed text-brand-cloud/85 sm:text-lg">
          A handpicked collection of design-forward homes — operated to institutional standards,
          priced dynamically, and concierged with care. Starting with Palm Springs and San Miguel
          de Allende, opening into the rest of the portfolio.
        </p>

        <div className="mt-10 flex flex-wrap gap-4">
          <MagneticButton
            as={Link}
            href="/destinations"
            className="bg-brand-cloud px-8 py-4 text-sm font-medium text-brand-ink hover:bg-brand-tan"
          >
            Explore destinations
          </MagneticButton>
          <MagneticButton
            as={Link}
            href="/events"
            className="border border-brand-cloud/40 px-8 py-4 text-sm font-medium text-brand-cloud hover:bg-brand-cloud/10"
          >
            Plan around events
          </MagneticButton>
        </div>
      </Container>
    </section>
  );
}
