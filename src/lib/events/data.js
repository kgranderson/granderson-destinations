/**
 * Extended anchor-event data — image-rich, with editorial detail
 * for each event page. Slug aligns with ANCHOR_EVENTS_SEED in
 * constants.js so the two can be merged at the consumer.
 */

const u = (id, w = 1600) =>
  `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&w=${w}&q=70`;

export const EVENT_DETAILS = {
  'coachella-2026-w1': {
    venue: 'Empire Polo Club, Indio',
    venueDistanceMin: 28,
    expectedAttendance: '~125,000/day',
    historicalDemand: '92% occupancy across the Coachella Valley',
    bookingLeadDays: 180,
    ticketsUrl: 'https://www.coachella.com',
    image: u('1493676304819-0d7a8d026dcf'),
    heroSummary:
      'The defining cultural weekend of the year for the Coachella Valley. Demand sets the rate ceiling for every property within an hour\'s drive.',
    body: [
      'Coachella Weekend 1 is the highest-demand weekend on the calendar — across the Coachella Valley, occupancy regularly hits 92%+ and ADRs run 1.5×–2.0× baseline. Premium properties within 25 miles of Empire Polo Club book out 60–90 days in advance.',
      'For Casa del Sol, the optimal play is a 4-night Thursday→Monday minimum, anchored to the festival\'s arrival/departure pattern. Our concierge team handles the airport-to-house transfer (PSP is 12 minutes; LAX is a 2-hour drive that we book early to avoid Friday afternoon traffic).',
      'Demand for the second weekend has historically been ~10% softer than W1. We treat the two weekends as separate pricing windows.',
    ],
    operatingPlaybook: [
      'Set 4-night minimum 90 days out; tighten to 5 if filling.',
      'Pre-book PSP transfers Thursday + Monday for every reservation.',
      'Stock the kitchen Thursday morning — guests arrive late.',
      'Pool cleaned Wednesday and Sunday; pre-festival housekeeping done Wed PM.',
    ],
  },
  'coachella-2026-w2': {
    venue: 'Empire Polo Club, Indio',
    venueDistanceMin: 28,
    expectedAttendance: '~125,000/day',
    historicalDemand: '85% occupancy across the Coachella Valley',
    bookingLeadDays: 150,
    ticketsUrl: 'https://www.coachella.com',
    image: u('1429962714451-bb934ecdc4ec'),
    heroSummary:
      'Slightly softer than W1 but still top-tier — and the better booking window if you missed the first wave.',
    body: [
      'Weekend 2 typically runs ~10% softer than W1 in occupancy and ADR, which makes it the smarter book for guests who don\'t want to compete. Programming is identical to W1 — same lineup, same set times, smaller crowds.',
      'For pricing, we run W2 at ~1.45× baseline (vs. 1.65× for W1). Min-stay stays at 4 nights to anchor the festival window.',
    ],
    operatingPlaybook: [
      '4-night minimum holds; rate-card 12% under W1.',
      'W2 guests skew slightly older — stock more sparkling water, less seltzer.',
    ],
  },
  'stagecoach-2026': {
    venue: 'Empire Polo Club, Indio',
    venueDistanceMin: 28,
    expectedAttendance: '~75,000/day',
    historicalDemand: '88% occupancy across the Coachella Valley',
    bookingLeadDays: 120,
    ticketsUrl: 'https://www.stagecoachfestival.com',
    image: u('1501281669428-1d1b8c98b1c8'),
    heroSummary:
      "Country music's biggest weekend brings a different guest profile but a similar ADR lift to Coachella.",
    body: [
      "Stagecoach lands the weekend after Coachella W2. The crowd is country-music devoted, the median guest is older than Coachella, and the average group size is larger (couples + friends, not solo arrivals).",
      'Pricing-wise, Stagecoach commands a comparable ADR uplift to Coachella W2 — 1.5× baseline. Min-stay can be relaxed to 3 nights without softening rate; the demand is more flexible on Sunday-night departures than Coachella.',
    ],
    operatingPlaybook: [
      '3-night minimum (Thu–Sun or Fri–Mon).',
      'Country-music playlist pre-loaded on Sonos.',
      'Stock cooler beer + bourbon vs. tequila vs. Coachella weekends.',
    ],
  },
  'bnp-paribas-2026': {
    venue: 'Indian Wells Tennis Garden',
    venueDistanceMin: 25,
    expectedAttendance: '~475,000 over 12 days',
    historicalDemand: '78% occupancy across IW + PS',
    bookingLeadDays: 90,
    ticketsUrl: 'https://bnpparibasopen.com',
    image: u('1502920917128-1aa500764cbd'),
    heroSummary:
      'Twelve days of ATP/WTA Masters 1000 tennis — sustained demand for week-long stays, not just weekends.',
    body: [
      'Indian Wells is the most attended tennis tournament in the world outside the four Slams. The 12-day window means demand pattern looks different from a festival weekend — less peaky, more sustained.',
      'For Casa del Sol, the BNP window is a 7-night-stay opportunity: a weekly rate at 1.35× baseline beats trying to chase 2-night weekends. Concierge can book Stadium 1 access, sponsor lounges, and player-day transfers.',
      'The 2027 expansion (+18,000 seats, new hospitality club) is a tailwind for 2027+ pricing, per the Intel feed.',
    ],
    operatingPlaybook: [
      '7-night minimum recommended; concierge can offer Indian Wells transfer service.',
      'Set up streaming on the lanai TV for tournament livestreams.',
    ],
  },
  'modernism-week-2026': {
    venue: 'Multiple sites across Palm Springs',
    venueDistanceMin: 5,
    expectedAttendance: '~150,000 over 11 days',
    historicalDemand: '82% occupancy across PS',
    bookingLeadDays: 90,
    ticketsUrl: 'https://modernismweek.com',
    image: u('1600596542815-ffad4c1539a9'),
    heroSummary:
      'The architectural pilgrimage of the year — and the perfect-fit guest for a midcentury home.',
    body: [
      'Modernism Week is 11 days of architecture tours, design pop-ups, and curated dinners across Palm Springs. The guest profile is design-aware, image-conscious, and stays an average of 4–5 nights.',
      'For Casa del Sol — a faithfully restored midcentury home — this is a marquee booking window. We feature the home\'s architectural pedigree (Wexler-influenced lines, original 1962 footprint) prominently in pricing copy.',
      'Programming was approved to expand to 13 days for 2027.',
    ],
    operatingPlaybook: [
      '3-night minimum; many guests will book a full week.',
      'Concierge pre-arranges architecture tour passes.',
      'Stage the home for the unannounced photographer — guests photograph everything.',
    ],
  },
  'festival-cervantino-2026': {
    venue: 'Multiple venues, Guanajuato + SMA',
    venueDistanceMin: 60,
    expectedAttendance: '~600,000 over the festival',
    historicalDemand: '85% occupancy across SMA Centro',
    bookingLeadDays: 150,
    ticketsUrl: 'https://www.festivalcervantino.gob.mx',
    image: u('1518998053901-5348d3961a04'),
    heroSummary:
      'Mexico\'s flagship arts festival — based in Guanajuato city but with a major SMA satellite program.',
    body: [
      'Festival Cervantino is Latin America\'s premier multidisciplinary arts festival. The main programming is in Guanajuato city (90 minutes by car from SMA), but the satellite venues at Bellas Artes, Teatro Ángela Peralta, and Parque Juárez bring serious overflow demand to SMA.',
      'For Casa Talavera, the play is to lean into the satellite programming — concierge curates a 3-night SMA itinerary that includes one venue night plus dinner at Áperi or Aperi\'s sister-restaurant.',
    ],
    operatingPlaybook: [
      '3-night minimum.',
      'Tickets sell out 60+ days in advance; book on guest behalf early.',
      'Pre-arrange driver from SMA → Guanajuato city for any guest attending main-stage programming.',
    ],
  },
  'dia-de-muertos-2026': {
    venue: 'Centro, San Miguel de Allende',
    venueDistanceMin: 0,
    expectedAttendance: '~120,000 over Oct 30 – Nov 2',
    historicalDemand: '95% occupancy across SMA Centro',
    bookingLeadDays: 180,
    ticketsUrl: null,
    image: u('1605807646983-377bc5a76493'),
    heroSummary:
      'San Miguel\'s most photographed celebration — the streets are alive, the rooftop view of the Parroquia is unforgettable.',
    body: [
      'Día de Muertos in SMA is one of the most beautifully staged celebrations in Mexico. The Jardín fills with altars; the Parroquia is lit; processions move through Centro nightly from Oct 30 through Nov 2.',
      'For Casa Talavera, the rooftop terrace is the front-row seat to the entire celebration — one of the highest-leverage stays in our portfolio. We book this window 6+ months in advance.',
    ],
    operatingPlaybook: [
      '3-night minimum (most book 4–5).',
      'Concierge curates altares route + cathedral procession access.',
      'Stock cempasúchil flowers for the terrace and entryway.',
      'Pre-set rooftop Sonos playlist of regional son jarocho.',
    ],
  },
  'jazz-festival-2026': {
    venue: 'Teatro Ángela Peralta + Centro',
    venueDistanceMin: 2,
    expectedAttendance: '~25,000 over 11 days',
    historicalDemand: '80% occupancy across SMA Centro',
    bookingLeadDays: 60,
    ticketsUrl: null,
    image: u('1415201364774-f6f0bb35f28f'),
    heroSummary:
      'Eleven days of intimate jazz + blues across Centro — a quieter, more sophisticated demand window.',
    body: [
      'The San Miguel International Jazz & Blues Festival runs 11 days across Centro venues. The crowd is older, more affluent, and longer-stay than Cervantino or Día de Muertos.',
      'For Casa Talavera, this is a steady-revenue window with weekly bookings outperforming nightly. Concierge can secure Teatro Ángela Peralta access and front-row tables at the more intimate venues.',
    ],
    operatingPlaybook: [
      '3-night minimum.',
      'Concierge pre-books Teatro Ángela Peralta seats.',
      'Pair with a chef\'s dinner at the home for one night of the stay.',
    ],
  },
};
