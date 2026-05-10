import { NextResponse } from 'next/server';
import { withCronAuth } from '@/lib/auth/cron';
import { fetchMarketIntel } from '@/lib/perplexity/intel';
import { MARKETS } from '@/lib/constants';
import { getAdminClient } from '@/lib/supabase/admin';

/**
 * Refreshes the city-council / entitlement intel feed for every
 * active market. Called weekly by Vercel cron.
 */
export const POST = withCronAuth(async () => {
  const supabase = getAdminClient();
  const results = [];

  for (const [market, meta] of Object.entries(MARKETS)) {
    const intel = await fetchMarketIntel({ market, marketLabel: meta.label });
    results.push({ market, items: intel.items?.length ?? 0, stub: intel.stub });

    if (supabase && intel.items?.length) {
      // Replace this market's intel rows atomically.
      await supabase.from('intel_items').delete().eq('market', market);
      await supabase.from('intel_items').insert(
        intel.items.map((i) => ({
          market,
          title: i.title,
          category: i.category,
          expected_impact: i.expectedImpact,
          magnitude: i.magnitude,
          earliest_date: i.earliestDate,
          latest_date: i.latestDate,
          summary: i.summary,
          revenue_thesis: i.revenueThesis,
          source_title: i.sourceTitle,
          source_url: i.sourceUrl,
        })),
      );
    }
  }

  return NextResponse.json({ ok: true, results, at: new Date().toISOString() });
});

export const GET = POST;
