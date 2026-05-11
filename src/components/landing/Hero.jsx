'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useEffect, useRef } from 'react';

export function LandingHero() {
  const imageRef = useRef(null);

  // Subtle parallax — translate the hero image at 0.15× the scroll
  // delta, capped at 80px. Honors prefers-reduced-motion via CSS.
  useEffect(() => {
    const el = imageRef.current;
    if (!el) return;
    const onScroll = () => {
      const y = Math.min(window.scrollY * 0.15, 80);
      el.style.setProperty('--parallax-y', `${y}px`);
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <section className="hero">
      <Image
        ref={imageRef}
        src="/properties/palm-springs/hero.jpg"
        alt=""
        fill
        priority
        sizes="100vw"
        className="hero-image parallax"
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
