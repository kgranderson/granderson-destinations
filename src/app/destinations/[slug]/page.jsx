import { notFound } from 'next/navigation';
import { NavBar } from '@/components/shared/NavBar';
import { Footer } from '@/components/shared/Footer';
import { Container } from '@/components/shared/Container';
import { PropertyHero } from '@/components/property/PropertyHero';
import { PropertyHighlights } from '@/components/property/PropertyHighlights';
import { PropertyGallery } from '@/components/property/PropertyGallery';
import { PropertyAmenities } from '@/components/property/PropertyAmenities';
import { PropertyNeighborhood } from '@/components/property/PropertyNeighborhood';
import { PropertyHotspots } from '@/components/property/PropertyHotspots';
import { PropertyEvents } from '@/components/property/PropertyEvents';
import { PropertyIntel } from '@/components/property/PropertyIntel';
import { PropertyReviews } from '@/components/property/PropertyReviews';
import { PropertyFAQ } from '@/components/property/PropertyFAQ';
import { BookingWidget } from '@/components/property/BookingWidget';
import { PROPERTIES, BRAND } from '@/lib/constants';
import { vacationRentalJsonLd } from '@/lib/seo/jsonLd';

// Re-render at most once an hour so the PropertyEvents filter
// (which uses "today") doesn't freeze at the original build time.
export const revalidate = 3600;

export async function generateStaticParams() {
  return PROPERTIES.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }) {
  const p = PROPERTIES.find((x) => x.slug === params.slug);
  if (!p) return {};
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://granderson-destinations.vercel.app';
  return {
    title: `${p.name} · ${p.city}`,
    description: p.tagline,
    alternates: {
      canonical: `${baseUrl}/destinations/${p.slug}`,
    },
    openGraph: {
      title: `${p.name} — ${p.city}`,
      description: p.tagline,
      url: `${baseUrl}/destinations/${p.slug}`,
      images: [{ url: p.coverImage, width: 1200, height: 800 }],
    },
    twitter: {
      card: 'summary_large_image',
      title: `${p.name} — ${p.city}`,
      description: p.tagline,
      images: [p.coverImage],
    },
  };
}

export default function PropertyPage({ params }) {
  const property = PROPERTIES.find((x) => x.slug === params.slug);
  if (!property) notFound();

  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://granderson-destinations.vercel.app';
  const ld = vacationRentalJsonLd({ property, baseUrl });

  return (
    <>
      <script
        type="application/ld+json"
        // eslint-disable-next-line react/no-danger
        dangerouslySetInnerHTML={{ __html: JSON.stringify(ld) }}
      />
      <NavBar />
      <main className="animate-page-in">
        <PropertyHero property={property} />

        {/* Two-column overview + sticky booking widget */}
        <section className="bg-brand-cloud">
          <Container>
            <div className="grid gap-10 py-20 sm:py-28 lg:grid-cols-12 lg:gap-16">
              <div className="lg:col-span-7">
                <p className="text-xs uppercase tracking-[0.32em] text-brand-slate/70">The home</p>
                <h2 className="display mt-3 text-display-lg text-brand-ink">
                  Designed for slow mornings and longer evenings.
                </h2>
                <p className="mt-6 text-base leading-relaxed text-brand-slate sm:text-lg">
                  {property.description}
                </p>
              </div>
              <div className="lg:col-span-5">
                <div className="lg:sticky lg:top-24">
                  <BookingWidget property={property} />
                </div>
              </div>
            </div>
          </Container>
        </section>

        <PropertyHighlights property={property} />
        <PropertyGallery property={property} />
        <PropertyAmenities property={property} />
        <PropertyHotspots property={property} />
        <PropertyNeighborhood property={property} />
        <PropertyEvents property={property} />
        <PropertyIntel property={property} />
        <PropertyReviews property={property} />
        <PropertyFAQ property={property} />

        {/* Closing booking CTA */}
        <section className="bg-brand-cloud py-24">
          <Container size="md">
            <div className="rounded-3xl bg-brand-ink p-10 text-brand-cloud sm:p-14">
              <p className="text-xs uppercase tracking-[0.32em] text-brand-cloud/70">Ready when you are</p>
              <h2 className="display mt-3 max-w-2xl text-display-md text-brand-cloud">
                {property.name} books out fast for {property.city} events. Pick your dates.
              </h2>
              <p className="mt-4 max-w-xl text-brand-cloud/80">
                Reservations include 24/7 concierge, our event-day playbook for {property.city}, and a frictionless
                check-in. {BRAND.name} is the team behind every stay.
              </p>
            </div>
          </Container>
        </section>
      </main>
      <Footer />
    </>
  );
}
