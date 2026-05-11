import Link from 'next/link';
import { Reveal } from '../shared/Reveal';

export function LandingCTA() {
  return (
    <Reveal as="section" className="cta-section container">
      <div className="eyebrow">Ready when you are</div>
      <h2>Pick a city. We&rsquo;ll handle the rest.</h2>
      <p className="italic-sub">
        Browse the homes, plan around the events, let the concierge orchestrate the stay.
      </p>
      <div className="ctas">
        <Link href="/destinations" className="btn btn-primary btn-large">Browse homes</Link>
        <Link href="/contact" className="btn btn-secondary btn-large">Talk to a concierge</Link>
      </div>
    </Reveal>
  );
}
