/**
 * Configuration spine for Granderson Destinations.
 *
 * Mirrors the role of constants.js in the Scholarship-Winner
 * architecture: every enumeration, brand token, copy block,
 * tier definition, and feature flag lives here.
 *
 * Anything sourced from the database does NOT belong here.
 */

// =============================================================
// Brand
// =============================================================
export const BRAND = {
  name: 'Granderson Destinations',
  tagline: 'Curated luxury stays across the world\'s most coveted destinations.',
  description:
    'A private portfolio of design-forward vacation rentals — from the modernist canyons of Palm Springs to the cobblestone hills of San Miguel de Allende — operated to top-quartile institutional standards.',
  legalName: 'Granderson Destinations LLC',
  founderName: 'Kwame J. Granderson',
  contactEmail: 'hello@destinationgh.com',
  bookingEmail: 'reservations@destinationgh.com',
  // NOTE: phone is intentionally null until provisioned — Footer/Contact
  // render "Coming soon" rather than a placeholder. Set when ready.
  phone: null,
  whatsapp: null,
  instagram: 'destinationgh',
  facebook: 'destinationgh',
  pinterest: 'destinationgh',
};

// Hex palette — source of truth for tailwind.config.js
export const COLORS = {
  ink: '#0E1116',
  sand: '#F5EFE6',
  tan: '#E8DCC6',
  terracotta: '#C6633C',
  jade: '#5E7C6B',
  gold: '#C9A24E',
  rose: '#D98E78',
  slate: '#3F4A56',
  cloud: '#FAFAF7',
};

// =============================================================
// Portfolio — minimal seed list; full property data lives in DB
// =============================================================
export const PROPERTIES = [
  {
    slug: 'palm-springs',
    name: 'Casa del Sol',
    shortName: 'Palm Springs',
    city: 'Palm Springs',
    region: 'California',
    country: 'USA',
    accent: 'terracotta',
    coverImage: '/properties/palm-springs/hero.jpg',
    tagline: 'Midcentury modern, mountain-backed, magazine-ready.',
    description:
      'A faithfully restored midcentury home tucked against the San Jacinto mountains, ten minutes from the Coachella Valley\'s best tables and a short drive to Indian Wells, Coachella, and Stagecoach. Three bedrooms, a sun-drenched pool deck, a chef\'s kitchen, and an outdoor living room built for slow mornings and longer evenings.',
    bedrooms: 3,
    bathrooms: 2.5,
    sleeps: 8,
    sizeSqft: 2400,
    baseAdrUsd: 720,
    lat: 33.8303,
    lng: -116.5453,
    addressLine: 'Indian Canyons neighborhood, Palm Springs, CA',
    pricelabsListingId: 'PL-PS-001',
    airdnaMarketCode: 'palm-springs-ca',
    highlights: [
      {
        title: 'Pool, spa, mountain backdrop',
        body: 'Heated saltwater pool, in-ground spa, and a full afternoon of San Jacinto sun on the deck.',
        image: '/properties/palm-springs/palm-springs-23.jpg',
      },
      {
        title: 'Built for entertaining',
        body: 'Bocce court, fire-pit lounge, BBQ + outdoor yoga deck, plus a 12-seat dining room indoors.',
        image: '/properties/palm-springs/palm-springs-46.jpg',
      },
      {
        title: 'Architect-restored midcentury',
        body: 'Original 1962 lines, modernized mechanicals, with quiet luxury throughout — the Modernism Week guests notice.',
        image: '/properties/palm-springs/palm-springs-50.jpg',
      },
    ],
    gallery: [
      '/properties/palm-springs/palm-springs-09.jpg',
      '/properties/palm-springs/palm-springs-08.jpg',
      '/properties/palm-springs/palm-springs-42.jpg',
      '/properties/palm-springs/palm-springs-23.jpg',
      '/properties/palm-springs/palm-springs-24.jpg',
      '/properties/palm-springs/palm-springs-25.jpg',
      '/properties/palm-springs/palm-springs-43.jpg',
      '/properties/palm-springs/palm-springs-44.jpg',
      '/properties/palm-springs/palm-springs-45.jpg',
      '/properties/palm-springs/palm-springs-50.jpg',
      '/properties/palm-springs/palm-springs-53.jpg',
      '/properties/palm-springs/palm-springs-34.jpg',
      '/properties/palm-springs/palm-springs-12.jpg',
      '/properties/palm-springs/palm-springs-14.jpg',
      '/properties/palm-springs/palm-springs-32.jpg',
      '/properties/palm-springs/palm-springs-33.jpg',
      '/properties/palm-springs/palm-springs-30.jpg',
      '/properties/palm-springs/palm-springs-31.jpg',
      '/properties/palm-springs/palm-springs-38.jpg',
      '/properties/palm-springs/palm-springs-40.jpg',
      '/properties/palm-springs/palm-springs-35.jpg',
      '/properties/palm-springs/palm-springs-37.jpg',
      '/properties/palm-springs/palm-springs-49.jpg',
      '/properties/palm-springs/palm-springs-51.jpg',
      '/properties/palm-springs/palm-springs-52.jpg',
      '/properties/palm-springs/palm-springs-55.jpg',
      '/properties/palm-springs/palm-springs-18.jpg',
      '/properties/palm-springs/palm-springs-19.jpg',
    ],
    amenities: {
      Outdoor: [
        'Heated saltwater pool',
        'In-ground spa',
        'Bocce court',
        'Fire-pit lounge',
        'Outdoor BBQ',
        'Yoga / stretch deck',
        'Multiple shaded lounge zones',
        'Hammock',
      ],
      Indoor: [
        'Chef\'s kitchen with espresso bar',
        'Dining for 12',
        'Game room (pool table, arcade)',
        'Media lounge',
        'Workspace',
        'Smart climate per zone',
      ],
      'Sleep & bath': [
        'Primary suite (king, ensuite)',
        'Guest suite A (king)',
        'Guest suite B (queen + bunks)',
        'Detached casita (queen)',
        'Heated bathroom floors',
      ],
      'Tech & comfort': [
        '1 Gbps fiber Wi-Fi',
        'Sonos throughout',
        '4K Apple TVs',
        'EV charger (Level 2)',
        '24/7 on-call concierge',
      ],
    },
    nearby: [
      { label: 'Workshop Kitchen + Bar', minutesDrive: 7, kind: 'restaurant' },
      { label: 'Tahquitz Canyon trailhead', minutesDrive: 6, kind: 'hike' },
      { label: 'PS Aerial Tram base', minutesDrive: 9, kind: 'experience' },
      { label: 'Indian Wells Tennis Garden', minutesDrive: 25, kind: 'venue' },
      { label: 'Empire Polo Club (Coachella/Stagecoach)', minutesDrive: 28, kind: 'venue' },
      { label: 'PSP Airport', minutesDrive: 12, kind: 'transit' },
    ],
    faqs: [
      {
        q: 'Is the pool heated?',
        a: 'Yes — the saltwater pool and spa are both heated year-round and included in the rate.',
      },
      {
        q: 'Can we host events on-site?',
        a: 'Up to 16 guests for a daytime gathering with prior approval. Overnight parties are limited to the booking party.',
      },
      {
        q: 'How early can we check in during Coachella / Stagecoach?',
        a: 'Standard check-in is 4 PM, but we typically open by 2 PM during festival weekends if turnover allows. Concierge will confirm 48 hours out.',
      },
      {
        q: 'Is there a minimum stay during peak events?',
        a: 'Yes — 4 nights for Coachella/Stagecoach weekends and BNP Paribas Open opening weekend; 3 nights for Modernism Week.',
      },
    ],
    isPrimary: true,
  },
  {
    slug: 'san-miguel-de-allende',
    name: 'Casa Talavera',
    shortName: 'San Miguel',
    city: 'San Miguel de Allende',
    region: 'Guanajuato',
    country: 'Mexico',
    accent: 'jade',
    coverImage: '/properties/san-miguel-de-allende/hero.jpg',
    tagline: 'A colonial courtyard estate in Mexico\'s most beautiful city.',
    description:
      'A walled colonial estate three blocks from the Jardín, set around a tiled courtyard with a fountain. Rooftop terrace with full views of the Parroquia, hand-painted Talavera throughout, and a kitchen built for the long, slow lunches that make San Miguel itself.',
    bedrooms: 4,
    bathrooms: 4,
    sleeps: 8,
    sizeSqft: 3200,
    baseAdrUsd: 410,
    lat: 20.9143,
    lng: -100.7448,
    addressLine: 'Centro Histórico, San Miguel de Allende, Gto.',
    pricelabsListingId: 'PL-SMA-001',
    airdnaMarketCode: 'san-miguel-de-allende-gto',
    highlights: [
      {
        title: 'Three blocks from the Jardín',
        body: 'Walk to the Parroquia, the best mezcalerías, and the Tuesday market without ever opening a rideshare app.',
        image: '/properties/san-miguel-de-allende/san-miguel-de-allende-08.jpg',
      },
      {
        title: 'Rooftop with the Parroquia view',
        body: 'A private terrace built for sunset cocktails and the pink-stone glow of the cathedral at golden hour.',
        image: '/properties/san-miguel-de-allende/san-miguel-de-allende-12.jpg',
      },
      {
        title: 'Authentic Talavera throughout',
        body: 'Hand-painted ceramics, hand-carved cantera stone, and a courtyard fountain that has been running since 1812.',
        image: '/properties/san-miguel-de-allende/san-miguel-de-allende-10.jpg',
      },
    ],
    gallery: [
      '/properties/san-miguel-de-allende/san-miguel-de-allende-06.jpg',
      '/properties/san-miguel-de-allende/san-miguel-de-allende-07.jpg',
      '/properties/san-miguel-de-allende/san-miguel-de-allende-08.jpg',
      '/properties/san-miguel-de-allende/san-miguel-de-allende-09.jpg',
      '/properties/san-miguel-de-allende/san-miguel-de-allende-10.jpg',
      '/properties/san-miguel-de-allende/san-miguel-de-allende-11.jpg',
      '/properties/san-miguel-de-allende/san-miguel-de-allende-12.jpg',
      '/properties/san-miguel-de-allende/san-miguel-de-allende-13.jpg',
      '/properties/san-miguel-de-allende/san-miguel-de-allende-14.jpg',
      '/properties/san-miguel-de-allende/san-miguel-de-allende-15.jpg',
    ],
    amenities: {
      Outdoor: [
        'Tiled central courtyard with fountain',
        'Rooftop terrace (Parroquia view)',
        'Fire pit',
        'Dipping pool',
      ],
      Indoor: [
        'Chef\'s kitchen with mezcal bar',
        'Dining for 10',
        'Library + reading nook',
        'Talavera-tiled fireplaces',
      ],
      'Sleep & bath': [
        'Primary suite (king, ensuite)',
        'Guest suite A (king)',
        'Guest suite B (queen)',
        'Casita off courtyard (queen)',
      ],
      'Tech & comfort': [
        'High-speed Wi-Fi',
        'Sonos in main rooms',
        'Smart TVs',
        'In-residence chef on request',
        '24/7 bilingual concierge',
      ],
    },
    nearby: [
      { label: 'Jardín & La Parroquia', minutesDrive: 2, kind: 'experience' },
      { label: 'Casa Dragones (mezcal experience)', minutesDrive: 3, kind: 'experience' },
      { label: 'Mercado del Carmen', minutesDrive: 5, kind: 'experience' },
      { label: 'Fábrica La Aurora (galleries)', minutesDrive: 6, kind: 'experience' },
      { label: 'BJX (León) Airport', minutesDrive: 90, kind: 'transit' },
      { label: 'QRO (Querétaro) Airport', minutesDrive: 60, kind: 'transit' },
    ],
    faqs: [
      {
        q: 'Is concierge included?',
        a: 'Yes — every booking includes our bilingual concierge who can arrange airport transfers, restaurant reservations, mezcal tastings, and in-house chef service.',
      },
      {
        q: 'How do we get from the airport?',
        a: 'BJX (León) is the closest international, ~90 minutes by car. QRO (Querétaro) is also viable at ~60 min. We book a private driver for every arrival on request.',
      },
      {
        q: 'Is the rooftop usable year-round?',
        a: 'Yes. June–September has occasional afternoon rain; the covered seating area keeps you dry through it. October–May is essentially perfect.',
      },
      {
        q: 'Can you arrange Día de Muertos access?',
        a: 'Yes — we secure access to the best altares, the cathedral procession route, and the Mariachi Mass. Booking 60+ days out is strongly recommended.',
      },
    ],
    isPrimary: true,
  },
];

export const ACCENT_HEX = {
  terracotta: COLORS.terracotta,
  jade: COLORS.jade,
  gold: COLORS.gold,
  rose: COLORS.rose,
};

// =============================================================
// Feature flags — control stub-mode vs. live integrations
// Each integration auto-falls-back to mock data when key is absent.
// =============================================================
export const FEATURE_FLAGS = {
  // Server-side checks happen in the lib/<service>/client.js wrappers
  perplexityLive: () => !!process.env.PERPLEXITY_API_KEY,
  pricelabsLive: () => !!process.env.PRICELABS_API_KEY,
  airdnaLive: () => !!process.env.AIRDNA_API_KEY,
  metaIgLive: () => !!process.env.META_LONG_LIVED_TOKEN,
  googlePlacesLive: () => !!process.env.GOOGLE_PLACES_API_KEY,
  stripeLive: () => !!process.env.STRIPE_SECRET_KEY,
  anthropicLive: () => !!process.env.ANTHROPIC_API_KEY,
};

// =============================================================
// Booking / pricing
// =============================================================
export const BOOKING = {
  depositPercent: 0.25,
  minNights: { default: 2, peak: 3, event: 4 },
  changeFeeUsd: 75,
  cancellationWindowDays: 14,
};

// =============================================================
// Concierge tier model (adapted from Scholarship Winner freemium)
// =============================================================
export const GUEST_TIERS = {
  guest: {
    label: 'Guest',
    aiItinerariesPerMonth: 3,
    earlyAccessHours: 0,
    perks: ['Booking platform', 'Curated guide', 'Concierge email'],
  },
  member: {
    label: 'Granderson Member',
    aiItinerariesPerMonth: 999,
    earlyAccessHours: 48,
    perks: [
      'Unlimited AI itineraries',
      '48-hour early access to new properties',
      'Member-only rates (5–8% off)',
      'Priority WhatsApp concierge',
      'Annual upgrade credit',
    ],
  },
};

// =============================================================
// Loyalty / gamification — adapted from badges in Scholarship Winner
// =============================================================
export const GUEST_BADGES = [
  { id: 'first-stay', label: 'First Stay', threshold: 1, kind: 'stays' },
  { id: 'repeat-guest', label: 'Repeat Guest', threshold: 3, kind: 'stays' },
  { id: 'multi-market', label: 'Multi-Market Explorer', threshold: 2, kind: 'markets' },
  { id: 'event-insider', label: 'Event Insider', threshold: 1, kind: 'events' },
  { id: 'long-stay', label: 'Long-Stay Connoisseur', threshold: 14, kind: 'nights' },
  { id: 'desert-devotee', label: 'Desert Devotee', threshold: 3, kind: 'palm-springs' },
  { id: 'colonial-collector', label: 'Colonial Collector', threshold: 3, kind: 'san-miguel' },
];

// =============================================================
// Anchor events — drive premium pricing (Feature 3)
// Real list lives in DB (table: anchor_events); this is the seed.
// =============================================================
export const ANCHOR_EVENTS_SEED = [
  // Palm Springs / Coachella Valley
  {
    slug: 'coachella-2026-w1',
    name: 'Coachella — Weekend 1',
    market: 'palm-springs',
    startDate: '2026-04-10',
    endDate: '2026-04-12',
    adrUpliftPct: 1.65,
    occupancyUpliftPct: 0.45,
    minStayNights: 4,
    notes: 'Highest-demand weekend of the year. Min-stay should anchor to Thu–Mon.',
    image: null,
  },
  {
    slug: 'coachella-2026-w2',
    name: 'Coachella — Weekend 2',
    market: 'palm-springs',
    startDate: '2026-04-17',
    endDate: '2026-04-19',
    adrUpliftPct: 1.45,
    occupancyUpliftPct: 0.4,
    minStayNights: 4,
    notes: 'Slightly softer than W1 but still 1.4×+ baseline ADR.',
    image: null,
  },
  {
    slug: 'stagecoach-2026',
    name: 'Stagecoach Festival',
    market: 'palm-springs',
    startDate: '2026-04-24',
    endDate: '2026-04-26',
    adrUpliftPct: 1.55,
    occupancyUpliftPct: 0.42,
    minStayNights: 3,
    notes: 'Country music draw — different guest profile than Coachella, similar ADR lift.',
    image: null,
  },
  {
    slug: 'bnp-paribas-2026',
    name: 'BNP Paribas Open (Indian Wells)',
    market: 'palm-springs',
    startDate: '2026-03-05',
    endDate: '2026-03-22',
    adrUpliftPct: 1.35,
    occupancyUpliftPct: 0.35,
    minStayNights: 3,
    notes: 'ATP/WTA Masters 1000 — 12 days of sustained demand. Strong for week-long stays.',
    image: null,
  },
  {
    slug: 'modernism-week-2026',
    name: 'Modernism Week',
    market: 'palm-springs',
    startDate: '2026-02-12',
    endDate: '2026-02-22',
    adrUpliftPct: 1.25,
    occupancyUpliftPct: 0.30,
    minStayNights: 3,
    notes: 'Architectural pilgrimage — ideal guest match for a midcentury home.',
    image: null,
  },
  // San Miguel de Allende
  {
    slug: 'festival-cervantino-2026',
    name: 'Festival Internacional Cervantino (regional)',
    market: 'san-miguel-de-allende',
    startDate: '2026-10-14',
    endDate: '2026-11-01',
    adrUpliftPct: 1.30,
    occupancyUpliftPct: 0.35,
    minStayNights: 3,
    notes: 'Headquartered in Guanajuato city but spills into SMA — strong arts crowd.',
    image: null,
  },
  {
    slug: 'dia-de-muertos-2026',
    name: 'Día de Muertos',
    market: 'san-miguel-de-allende',
    startDate: '2026-10-30',
    endDate: '2026-11-02',
    adrUpliftPct: 1.50,
    occupancyUpliftPct: 0.45,
    minStayNights: 3,
    notes: 'SMA has one of the most photographed Día de Muertos celebrations in Mexico.',
    image: null,
  },
  {
    slug: 'jazz-festival-2026',
    name: 'San Miguel International Jazz & Blues Festival',
    market: 'san-miguel-de-allende',
    startDate: '2026-11-19',
    endDate: '2026-11-29',
    adrUpliftPct: 1.20,
    occupancyUpliftPct: 0.30,
    minStayNights: 3,
    image: null,
  },
];

// =============================================================
// Markets — submarket metadata used by AirDNA + PriceLabs
// =============================================================
export const MARKETS = {
  'palm-springs': {
    label: 'Palm Springs',
    submarket: 'Greater Palm Springs',
    countryCode: 'US',
    currency: 'USD',
    timeZone: 'America/Los_Angeles',
    airdnaMarketCode: 'palm-springs-ca',
    googlePlaceId: 'ChIJUd3-FQNQ24ARfvD80rO9SOg',
  },
  'san-miguel-de-allende': {
    label: 'San Miguel de Allende',
    submarket: 'Centro Histórico',
    countryCode: 'MX',
    currency: 'USD', // PriceLabs/AirDNA report in USD
    timeZone: 'America/Mexico_City',
    airdnaMarketCode: 'san-miguel-de-allende-gto',
    googlePlaceId: 'ChIJZcCN2WLRKoQRk4S3sZ_FXLs',
  },
};

// =============================================================
// Page metadata helpers
// =============================================================
export const DEFAULT_OG = {
  type: 'website',
  siteName: BRAND.name,
  image: '/og/default.jpg',
};
