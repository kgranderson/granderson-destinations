import Link from 'next/link';
import { Container } from '../shared/Container';
import { Reveal } from '../shared/Reveal';
import { IntelCard } from '../intel/IntelCard';
import { fetchMarketIntel } from '@/lib/perplexity/intel';
import { MARKETS } from '@/lib/constants';

export async function PropertyIntel({ property }) {
  const market = MARKETS[property.slug];
  if (!market) return null;
  const intel = await fetchMarketIntel({ market: property.slug, marketLabel: market.label });
  // Show only the highest-magnitude items so the section stays editorial.
  const items = (intel.items || [])
    .filter((i) => i.magnitude !== 'low')
    .slice(0, 3);
  if (!items.length) return null;

  return (
    <section className="bg-brand-sand/40 py-20 sm:py-28">
      <Container>
        <div className="flex flex-wrap items-end justify-between gap-4">
          <Reveal>
            <p className="text-xs uppercase tracking-[0.32em] text-brand-slate/70">
              Market intel · {property.shortName}
            </p>
            <h2 className="display mt-3 max-w-3xl text-display-lg text-brand-ink">
              What&rsquo;s about to change in this market.
            </h2>
            {intel.summary && (
              <p className="mt-4 max-w-2xl text-brand-slate">{intel.summary}</p>
            )}
          </Reveal>
          <Link href="/intel" className="text-sm font-medium text-brand-ink underline-offset-4 hover:underline">
            See full intel feed →
          </Link>
        </div>

        <div className="mt-12 grid gap-6 stagger-grid md:grid-cols-3">
          {items.map((item, i) => (
            <Reveal key={i}>
              <IntelCard item={item} />
            </Reveal>
          ))}
        </div>

        {intel.stub && (
          <p className="mt-6 text-xs text-brand-slate">
            Editorial fallback — live Perplexity feed activates when{' '}
            <code className="rounded bg-brand-tan/40 px-1">PERPLEXITY_API_KEY</code> is set in Vercel envs.
          </p>
        )}
      </Container>
    </section>
  );
}
