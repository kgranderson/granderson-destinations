import { NavBar } from '@/components/shared/NavBar';
import { Footer } from '@/components/shared/Footer';
import { Container } from '@/components/shared/Container';
import { fetchMarketIntel } from '@/lib/perplexity/intel';
import { MARKETS } from '@/lib/constants';

export const metadata = {
  title: 'Market intel',
  description: 'Upcoming developments — city council, entitlement filings, festival programming — that move ADR and occupancy in our markets.',
};

// Refresh server-side at most once an hour even before cron is enabled.
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
      <main className="animate-page-in pt-32">
        <Container className="pb-20">
          <p className="text-xs uppercase tracking-[0.32em] text-brand-slate/70">Market intel</p>
          <h1 className="display mt-3 text-display-lg text-brand-ink">What&rsquo;s coming, and what it means.</h1>
          <p className="mt-4 max-w-2xl text-brand-slate">
            City-council agendas, entitlement filings, festival programming, hotel openings — everything we
            think is going to move the dial in our markets over the next 12 months.
          </p>

          {feeds.map((feed) => (
            <section key={feed.market} className="mt-14">
              <div className="flex items-baseline justify-between">
                <h2 className="display text-display-md text-brand-ink">{feed.label}</h2>
                {feed.stub && (
                  <span className="rounded-full bg-brand-tan/60 px-3 py-1 text-[10px] uppercase tracking-widest text-brand-slate">
                    Stub data
                  </span>
                )}
              </div>
              <p className="mt-2 max-w-3xl text-brand-slate">{feed.summary}</p>

              <div className="mt-8 grid gap-4 md:grid-cols-2">
                {(feed.items || []).map((item, i) => (
                  <article key={i} className="rounded-2xl border border-brand-tan/60 bg-brand-cloud p-6 shadow-soft">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className={badgeClass(item.expectedImpact)}>{item.expectedImpact}</span>
                      <span className="rounded-full border border-brand-tan px-2 py-0.5 text-[10px] uppercase tracking-widest text-brand-slate">
                        {item.category}
                      </span>
                      <span className="rounded-full bg-brand-ink/10 px-2 py-0.5 text-[10px] uppercase tracking-widest text-brand-slate">
                        {item.magnitude}
                      </span>
                    </div>
                    <h3 className="mt-3 text-lg font-medium text-brand-ink">{item.title}</h3>
                    <p className="mt-2 text-sm leading-relaxed text-brand-slate">{item.summary}</p>
                    <p className="mt-3 text-xs italic text-brand-ink/80">{item.revenueThesis}</p>
                    {item.sourceUrl && (
                      <a
                        href={item.sourceUrl}
                        target="_blank"
                        rel="noreferrer noopener"
                        className="mt-3 inline-block text-xs underline"
                      >
                        {item.sourceTitle || 'Source'} →
                      </a>
                    )}
                  </article>
                ))}
              </div>
            </section>
          ))}
        </Container>
      </main>
      <Footer />
    </>
  );
}

function badgeClass(impact) {
  const base = 'rounded-full px-2 py-0.5 text-[10px] uppercase tracking-widest';
  if (impact === 'positive') return `${base} bg-brand-jade/15 text-brand-jade`;
  if (impact === 'negative') return `${base} bg-brand-terracotta/15 text-brand-terracotta`;
  return `${base} bg-brand-gold/15 text-brand-gold`;
}
