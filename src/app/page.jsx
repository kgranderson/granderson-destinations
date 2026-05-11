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
        <LandingHero />
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
        <Stats />
        <LandingCTA />
      </main>
      <Footer />
    </>
  );
}
