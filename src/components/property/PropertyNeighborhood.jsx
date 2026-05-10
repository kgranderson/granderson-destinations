import { Container } from '../shared/Container';
import { Reveal } from '../shared/Reveal';
import { MapPin, Utensils, Mountain, Sparkles, Plane, TicketCheck } from 'lucide-react';

const KIND_ICON = {
  restaurant: Utensils,
  hike: Mountain,
  experience: Sparkles,
  venue: TicketCheck,
  transit: Plane,
};

export function PropertyNeighborhood({ property }) {
  const items = property.nearby ?? [];
  if (!items.length) return null;

  // Static map (Google Maps Static API in live mode; gradient fallback in stub mode).
  const hasMapsKey = !!process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
  const mapUrl =
    hasMapsKey && property.lat && property.lng
      ? `https://maps.googleapis.com/maps/api/staticmap?center=${property.lat},${property.lng}&zoom=13&size=720x520&scale=2&maptype=roadmap&style=feature:poi%7Cvisibility:off&style=feature:road%7Celement:labels%7Cvisibility:simplified&style=feature:landscape%7Celement:geometry%7Ccolor:0xefe7da&markers=color:0xC9A24E%7Csize:mid%7C${property.lat},${property.lng}&key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}`
      : null;

  return (
    <section className="bg-brand-cloud py-20 sm:py-28">
      <Container>
        <div className="grid gap-10 md:grid-cols-12">
          <div className="md:col-span-5">
            <Reveal>
              <p className="text-xs uppercase tracking-[0.32em] text-brand-slate/70">Neighborhood</p>
              <h2 className="display mt-3 text-display-lg text-brand-ink">
                Where you actually are.
              </h2>
              <p className="mt-4 text-brand-slate">
                Driving times from the front door — accurate within a few minutes off-peak. Concierge handles
                airport transfers, restaurant bookings, and event-day logistics.
              </p>
              <ul className="mt-8 space-y-4">
                {items.map((n) => {
                  const Icon = KIND_ICON[n.kind] || MapPin;
                  return (
                    <li key={n.label} className="flex items-start gap-3">
                      <span className="mt-0.5 inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand-sand/60 text-brand-gold">
                        <Icon size={16} />
                      </span>
                      <div className="flex-1">
                        <p className="font-medium text-brand-ink">{n.label}</p>
                        <p className="text-sm text-brand-slate">{n.minutesDrive} min drive</p>
                      </div>
                    </li>
                  );
                })}
              </ul>
            </Reveal>
          </div>

          <div className="md:col-span-7">
            <Reveal delayMs={120}>
              <div className="relative aspect-[4/3] overflow-hidden rounded-2xl border border-brand-tan/60 bg-brand-sand/40 shadow-soft">
                {mapUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={mapUrl} alt={`Map — ${property.city}`} className="h-full w-full object-cover" />
                ) : (
                  <div className="flex h-full w-full flex-col items-center justify-center bg-[radial-gradient(120%_80%_at_30%_30%,#E8DCC6,#F5EFE6)] p-10 text-center">
                    <MapPin className="text-brand-gold" size={28} />
                    <p className="display mt-3 text-2xl text-brand-ink">{property.city}</p>
                    <p className="mt-1 text-sm text-brand-slate">{property.addressLine}</p>
                    <p className="mt-4 text-xs uppercase tracking-widest text-brand-slate/70">
                      Live map renders when GOOGLE_MAPS_API_KEY is set
                    </p>
                  </div>
                )}
              </div>
            </Reveal>
          </div>
        </div>
      </Container>
    </section>
  );
}
