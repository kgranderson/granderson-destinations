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
    image: '/events/coachella.jpg',
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
    image: '/events/coachella.jpg',
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
    image: '/events/stagecoach.jpg',
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
    image: '/events/indian-wells.jpg',
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
    image: '/events/modernism-week.jpg',
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
    image: '/events/cervantino.jpg',
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
    image: '/events/dia-de-muertos.jpg',
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
    image: '/events/sma-jazz.jpg',
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
