/**
 * Feature 1 — City Council & Entitlement Intel.
 *
 * Discovers upcoming projects (hotel openings, new restaurants,
 * road work, festivals, large entitlements) that are likely to
 * affect short-term-rental demand or daily rate in a given market.
 */
import { unstable_cache } from 'next/cache';
import { perplexityChat } from './client';

const SYSTEM = `You are a senior real-estate research analyst specializing in short-term rental markets.
You are scanning city-council agendas, planning-commission filings, entitlement records, business journals,
local newspapers, and tourism-board announcements for upcoming developments that would plausibly affect
average daily rate (ADR), occupancy, or guest demand in a specific submarket over the next 12 months.

Return ONLY a JSON object with this exact shape (no prose, no markdown fence):
{
  "summary": "1–2 sentence executive overview",
  "items": [
    {
      "title": "...",
      "category": "hotel|restaurant|venue|festival|transit|development|policy|other",
      "expectedImpact": "positive|negative|mixed",
      "magnitude": "low|medium|high",
      "earliestDate": "YYYY-MM" | null,
      "latestDate":   "YYYY-MM" | null,
      "summary": "1–3 sentence plain-English description",
      "revenueThesis": "How this affects ADR or occupancy and why",
      "sourceTitle": "human-readable source name",
      "sourceUrl": "full URL"
    }
  ]
}`;

async function _fetchMarketIntel({ market, marketLabel, lookaheadMonths = 12 } = {}) {
  const userPrompt = `Find upcoming developments over the next ${lookaheadMonths} months that are likely to
affect short-term rental demand or ADR in ${marketLabel}. Focus on: new hotel/condo openings, major restaurant
openings, festival or sporting-event additions, road/airport/transit projects, new entitlements affecting
neighborhood character, and policy changes (STR ordinances, lodging taxes). Pull from city council agendas,
planning commission filings, business journals, local newspapers, and tourism-board announcements.
Return strict JSON per the schema in the system prompt.`;

  const res = await perplexityChat({ prompt: userPrompt, systemPrompt: SYSTEM });

  if (res.stub) return stubIntel(market);

  try {
    const cleaned = res.content
      .replace(/^```json\s*/i, '')
      .replace(/^```\s*/i, '')
      .replace(/```\s*$/i, '')
      .trim();
    const parsed = JSON.parse(cleaned);
    return {
      ...parsed,
      stub: false,
      fetchedAt: new Date().toISOString(),
      citations: res.citations || [],
    };
  } catch (err) {
    return {
      stub: false,
      summary: 'Intel feed returned an unparseable response.',
      items: [],
      rawText: res.content,
      citations: res.citations || [],
      parseError: String(err),
      fetchedAt: new Date().toISOString(),
    };
  }
}

// Cache fetched intel for 1 hour, keyed by market — prevents the same
// page render kicking off two Perplexity calls for the same data, and
// caps cron-driven cold revalidation cost.
export const fetchMarketIntel = unstable_cache(
  _fetchMarketIntel,
  ['market-intel'],
  { revalidate: 3600, tags: ['intel'] },
);

function stubIntel(market) {
  const base = {
    fetchedAt: new Date().toISOString(),
    stub: true,
    citations: [],
  };

  if (market === 'palm-springs') {
    return {
      ...base,
      summary:
        'Two material positives over the next 12 months: a new boutique hotel adds 84 keys to the downtown comp set (slight headwind), but the BNP Paribas expansion at Indian Wells Tennis Garden adds 18,000 seats and a March demand window — net ADR-positive for downtown villas.',
      items: [
        {
          title: 'Indian Wells Tennis Garden capacity expansion approved',
          category: 'venue',
          expectedImpact: 'positive',
          magnitude: 'high',
          earliestDate: '2026-12',
          latestDate: '2027-03',
          summary:
            '$70M expansion adds 18,000 additional seats across Stadiums 2 and 4 plus new hospitality club, completing before the 2027 BNP Paribas Open.',
          revenueThesis:
            'Adds ~3 nights/day of incremental room demand across the 12-day tournament. Coachella Valley villas within 25 mi historically capture 30–40% ADR uplift for tennis week; expansion should compress further.',
          sourceTitle: 'Desert Sun — Indian Wells expansion filing',
          sourceUrl: 'https://www.desertsun.com/',
        },
        {
          title: 'Kimpton "Palm Mesa" 84-key boutique hotel — entitlement granted',
          category: 'hotel',
          expectedImpact: 'mixed',
          magnitude: 'medium',
          earliestDate: '2026-11',
          latestDate: '2027-06',
          summary:
            'Council approved entitlement for an 84-key Kimpton on N. Indian Canyon Dr; opening targeted Q3 2027. Adds compset supply but elevates downtown\'s hospitality brand.',
          revenueThesis:
            '+84 keys downtown is a ~2% supply increase. Likely 50–75 bps occupancy drag in non-peak months, offset by brand halo on the corridor.',
          sourceTitle: 'Palm Springs Planning Commission Agenda 04/14/2026',
          sourceUrl: 'https://www.palmspringsca.gov/government/departments/planning',
        },
        {
          title: 'Palm Springs Modernism Week — expanded 2027 dates',
          category: 'festival',
          expectedImpact: 'positive',
          magnitude: 'medium',
          earliestDate: '2027-02',
          latestDate: '2027-02',
          summary:
            'Festival board approved a 13-day program (vs. 11 in 2026) including a new "Mid-Century Architecture Tour Pass" expected to lift mid-week demand.',
          revenueThesis:
            'Adds two material demand nights mid-week. Properties with documented MCM architectural pedigree (your Casa del Sol) should see strongest premium capture.',
          sourceTitle: 'Modernism Week press release',
          sourceUrl: 'https://modernismweek.com/',
        },
        {
          title: 'STR ordinance amendment — caretaker requirement',
          category: 'policy',
          expectedImpact: 'negative',
          magnitude: 'low',
          earliestDate: '2026-07',
          latestDate: '2026-07',
          summary:
            'City clarified that a local emergency contact (within 30 minutes) must be listed on every STR permit. Procedural; no occupancy cap change.',
          revenueThesis:
            'No revenue impact for professionally managed properties; tightens noose on absentee non-compliant operators which is a long-term tailwind for compliant supply.',
          sourceTitle: 'Palm Springs City Council Meeting 06/12/2026',
          sourceUrl: 'https://www.palmspringsca.gov/government/agendas-and-minutes',
        },
      ],
    };
  }

  return {
    ...base,
    summary:
      'Mexico\'s Festival Cervantino announced an SMA satellite program; one Centro hotel changed hands; new Querétaro–SMA shuttle launches in October — net mildly positive on ADR.',
    items: [
      {
        title: 'Festival Cervantino — SMA satellite venues confirmed',
        category: 'festival',
        expectedImpact: 'positive',
        magnitude: 'high',
        earliestDate: '2026-10',
        latestDate: '2026-11',
        summary:
          'Three SMA venues (Teatro Ángela Peralta, Bellas Artes, Parque Juárez) added to the 2026 Cervantino program. SMA always benefits from Guanajuato\'s overflow; formal programming locks demand 3 weeks early.',
        revenueThesis:
          'Extends the ADR premium window from ~10 days (Día de Muertos) to ~25 days. Add 2–3 nights min-stay during the overlap.',
        sourceTitle: 'Festival Internacional Cervantino — 2026 program',
        sourceUrl: 'https://www.festivalcervantino.gob.mx/',
      },
      {
        title: 'Querétaro–SMA luxury shuttle launches October 2026',
        category: 'transit',
        expectedImpact: 'positive',
        magnitude: 'medium',
        earliestDate: '2026-10',
        latestDate: '2026-10',
        summary:
          'New private shuttle operator (Premier Mexico) launches twice-daily luxury van service from QRO airport to Centro SMA, with hotel-style pickup amenities. Reduces friction for US flyers.',
        revenueThesis:
          'Improves conversion on US guests by removing the ground-transport question. Worth featuring on the property page and concierge brief.',
        sourceTitle: 'Atención San Miguel — transit announcement',
        sourceUrl: 'https://atencionsanmiguel.org/',
      },
      {
        title: 'Hotel Matilda ownership transition',
        category: 'hotel',
        expectedImpact: 'mixed',
        magnitude: 'low',
        earliestDate: '2026-08',
        latestDate: '2026-08',
        summary:
          'Group sold; new ownership signaled a renovation pause. Possible compset rate softness for 90–180 days during transition.',
        revenueThesis:
          'A flagship comp going quiet typically lifts secondary lux comps by 3–5% on shoulder weekends. Watch for the reopen.',
        sourceTitle: 'San Miguel Times',
        sourceUrl: 'https://sanmigueltimes.com/',
      },
    ],
  };
}
