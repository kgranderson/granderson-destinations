import { NavBar } from '@/components/shared/NavBar';
import { Footer } from '@/components/shared/Footer';
import { LandingHero } from '@/components/landing/Hero';
import { Marquee } from '@/components/shared/Marquee';
import { PropertyShowcase } from '@/components/landing/PropertyShowcase';
import { FeatureGrid } from '@/components/landing/FeatureGrid';
import { Stats } from '@/components/landing/Stats';
import { LandingCTA } from '@/components/landing/CTA';

export default function HomePage() {
  return (
    <>
      <NavBar />
      <main>
        {/* Cinematic dark hero (full-bleed photo, ken-burns + parallax) */}
        <LandingHero />

        {/* Editorial bone band — content lives in the light */}
        <div className="surface-bone">
          <Marquee
            items={[
              'Palm Springs',
              'San Miguel de Allende',
              'Coming · Jamaica',
              'Coming · Tulum',
              'Coming · Joshua Tree',
            ]}
          />
          <PropertyShowcase />
          <FeatureGrid />
        </div>

        {/* Single dark moment of punctuation — the receipts */}
        <Stats />

        {/* Final ask in bone */}
        <div className="surface-bone">
          <LandingCTA />
        </div>
      </main>
      <Footer />
    </>
  );
}
