import Link from 'next/link';
import { Container } from '../shared/Container';
import { MagneticButton } from '../shared/MagneticButton';
import { Reveal } from '../shared/Reveal';

export function LandingCTA() {
  return (
    <section className="bg-brand-cloud py-24 sm:py-32">
      <Container size="md">
        <Reveal>
          <div className="relative overflow-hidden rounded-3xl bg-brand-ink p-10 text-brand-cloud sm:p-16">
            <div
              aria-hidden
              className="absolute inset-0 -z-10 bg-[radial-gradient(60%_60%_at_85%_15%,#C9A24E55,transparent)]"
            />
            <p className="text-xs uppercase tracking-[0.32em] text-brand-cloud/70">Ready when you are</p>
            <h2 className="display mt-4 max-w-2xl text-display-md text-brand-cloud">
              Pick a city. We&rsquo;ll handle the rest.
            </h2>
            <p className="mt-4 max-w-xl text-brand-cloud/85">
              Browse the homes, plan around the events, and let our concierge orchestrate the stay.
            </p>
            <div className="mt-8 flex flex-wrap gap-4">
              <MagneticButton
                as={Link}
                href="/destinations"
                className="bg-brand-cloud px-8 py-4 text-sm font-medium text-brand-ink hover:bg-brand-tan"
              >
                Browse homes
              </MagneticButton>
              <MagneticButton
                as={Link}
                href="/contact"
                className="border border-brand-cloud/40 px-8 py-4 text-sm font-medium text-brand-cloud hover:bg-brand-cloud/10"
              >
                Talk to a concierge
              </MagneticButton>
            </div>
          </div>
        </Reveal>
      </Container>
    </section>
  );
}
