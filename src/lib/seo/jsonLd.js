/**
 * Structured-data helpers (JSON-LD). Render the returned object as
 * <script type="application/ld+json"> on relevant pages.
 */

export function vacationRentalJsonLd({ property, baseUrl }) {
  return {
    '@context': 'https://schema.org',
    '@type': 'LodgingBusiness',
    name: property.name,
    description: property.tagline,
    url: `${baseUrl}/destinations/${property.slug}`,
    image: `${baseUrl}${property.coverImage}`,
    address: {
      '@type': 'PostalAddress',
      addressLocality: property.city,
      addressRegion: property.region,
      addressCountry: property.country,
    },
    geo: property.lat && property.lng
      ? { '@type': 'GeoCoordinates', latitude: property.lat, longitude: property.lng }
      : undefined,
  };
}

export function eventJsonLd({ event, baseUrl }) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Event',
    name: event.name,
    startDate: event.startDate,
    endDate: event.endDate,
    eventStatus: 'https://schema.org/EventScheduled',
    eventAttendanceMode: 'https://schema.org/OfflineEventAttendanceMode',
    location: {
      '@type': 'Place',
      name: event.market.replace(/-/g, ' '),
    },
    image: event.image ? `${baseUrl}${event.image}` : undefined,
  };
}
