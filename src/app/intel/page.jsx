import { NavBar } from '@/components/shared/NavBar';
import { Footer } from '@/components/shared/Footer';
import { Container } from '@/components/shared/Container';
import { IntelCard } from '@/components/intel/IntelCard';
import { fetchMarketIntel } from '@/lib/perplexity/intel';
import { MARKETS } from '@/lib/constants';

export const metadata = {
  title: 'Market intel',
  description:
    'Upcoming developments — city council, entitlement filings, festival programming, hotel openings — that move ADR and occupancy in our markets.',
};

// Refresh server-side at most once an hour. Cron also refreshes weekly via /api/intel/refresh.
export const revalidate = 3600;

export default async function IntelPage() {
  const feeds = await Promise.all(
    Object.entries(MARKETS).map(async ([market, m]) => ({
      market,
      label: m.label,
      ...(await fetchMarketIntel({ market, marketLabel: m.label })),
    })),
  );

  return (
    <>
      <NavBar />
      <main className="animate-page-in">
        {/* Hero */}
        <section className="bg-brand-ink py-32 text-brand-cloud">
          <Container>
            <p className="text-xs uppercase tracking-[0.32em] text-brand-cloud/70">Market intel</p>
            <h1 className="display mt-3 max-w-4xl text-display-xl text-brand-cloud">
              What&rsquo;s coming. What it means.
            </h1>
            <p className="mt-4 max-w-2xl text-base leading-relaxed text-brand-cloud/85 sm:text-lg">
              City-council agendas, entitlement filings, festival programming, hotel openings —
              everything we think is going to move the dial in our markets over the next twelve months.
              Refreshed weekly via Perplexity Sonar.
            </p>
          </Container>
        </section>

        {/* Per-market feeds */}
        {feeds.map((feed) => (
          <section key={feed.market} className="bg-brand-cloud py-20">
            <Container>
              <div className="flex flex-wrap items-end justify-between gap-4">
                <div>
                  <p className="text-xs uppercase tracking-[0.32em] text-brand-slate/70">{feed.label}</p>
                  <h2 className="display mt-2 text-display-md text-brand-ink">{feed.label} intel feed</h2>
                </div>
                {feed.stub && (
                  <span className="rounded-full bg-brand-tan/60 px-3 py-1 text-[10px] uppercase tracking-widest text-brand-slate">
                    Editorial fallback
                  </span>
                )}
              </div>
              {feed.summary && (
                <p className="mt-3 max-w-3xl text-brand-slate">{feed.summary}</p>
              )}

              <div className="mt-10 grid gap-6 stagger-grid md:grid-cols-2 lg:grid-cols-3">
                {(feed.items || []).map((item, i) => (
                  <IntelCard key={i} item={item} />
                ))}
              </div>
            </Container>
          </section>
        ))}
      </main>
      <Footer />
    </>
  );
}
