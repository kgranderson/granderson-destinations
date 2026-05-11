import Link from 'next/link';
import Image from 'next/image';

export function LandingHero() {
  return (
    <section className="hero">
      <Image
        src="/properties/palm-springs/hero.jpg"
        alt=""
        fill
        priority
        sizes="100vw"
        className="hero-image"
      />
      <div className="hero-overlay" aria-hidden />
      <div>
        <div className="eyebrow">A Private Portfolio · MMXXVI</div>
        <h1>Curated luxury stays in the world&rsquo;s most magnetic destinations.</h1>
        <p className="lede">
          A handpicked collection of design-forward homes, operated to institutional standards,
          priced dynamically, and concierged with care. Starting with Palm Springs and San Miguel
          de Allende, opening into the rest of the portfolio.
        </p>
        <div className="ctas">
          <Link href="/destinations" className="btn btn-primary btn-large">Explore destinations</Link>
          <Link href="/events" className="btn btn-secondary btn-large">Plan around events</Link>
        </div>
      </div>
    </section>
  );
}
