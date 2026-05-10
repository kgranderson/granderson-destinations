import Link from 'next/link';
import { NavBar } from '@/components/shared/NavBar';
import { Footer } from '@/components/shared/Footer';
import { Container } from '@/components/shared/Container';
import { PROPERTIES } from '@/lib/constants';
import { loadMonthly } from '@/lib/economics/loader';
import { rollupMonthly, withDerived } from '@/lib/economics/model';
import { usd, pct } from '@/lib/utils/format';
import { ArrowUpRight } from 'lucide-react';

export const revalidate = 600;

export const metadata = {
  title: 'Economics · Portfolio',
  description: 'Portfolio-level revenue, expense, and NOI snapshot across Granderson Destinations homes.',
  robots: { index: false, follow: false },
};

export default async function EconomicsIndex() {
  const blocks = await Promise.all(
    PROPERTIES.map(async (p) => {
      const { rows } = await loadMonthly(p.slug);
      const rolled = withDerived(rollupMonthly(rows));
      const ttm = rolled.slice(-12);
      const prior = rolled.slice(-24, -12);
      const sum = (arr, k) => arr.reduce((s, m) => s + (m[k] || 0), 0);
      const rev = sum(ttm, 'revenue');
      const exp = sum(ttm, 'expenses');
      const noi = rev - exp;
      const priorRev = sum(prior, 'revenue');
      const priorNoi = sum(prior, 'revenue') - sum(prior, 'expenses');
      return {
        property: p,
        ttmRevenue: rev,
        ttmNoi: noi,
        margin: rev > 0 ? noi / rev : 0,
        revYoy: priorRev > 0 ? (rev - priorRev) / priorRev : 0,
        noiYoy: priorNoi > 0 ? (noi - priorNoi) / priorNoi : 0,
      };
    }),
  );

  const portfolioRev = blocks.reduce((s, b) => s + b.ttmRevenue, 0);
  const portfolioNoi = blocks.reduce((s, b) => s + b.ttmNoi, 0);

  return (
    <>
      <NavBar />
      <main className="animate-page-in bg-brand-cloud pt-32">
        <Container className="pb-20">
          <p className="text-xs uppercase tracking-[0.32em] text-brand-slate/70">Portfolio economics</p>
          <h1 className="display mt-3 text-display-lg text-brand-ink">Operating dashboard</h1>
          <p className="mt-2 max-w-2xl text-sm text-brand-slate">
            Trailing-twelve operating performance across the portfolio. Click any property for the full
            dashboard — comp benchmarking, expense outlier flags, and revenue-lever modeling.
          </p>

          {/* Portfolio totals */}
          <div className="mt-10 grid gap-4 sm:grid-cols-3">
            <Stat label="Portfolio TTM revenue" value={usd(portfolioRev)} />
            <Stat label="Portfolio TTM NOI"     value={usd(portfolioNoi)} />
            <Stat
              label="Portfolio NOI margin"
              value={pct(portfolioRev > 0 ? portfolioNoi / portfolioRev : 0, { fractionDigits: 1 })}
            />
          </div>

          {/* Per-property cards */}
          <div className="mt-8 grid gap-6 md:grid-cols-2">
            {blocks.map((b) => (
              <Link
                key={b.property.slug}
                href={`/economics/${b.property.slug}`}
                className="group block rounded-2xl border border-brand-tan/60 bg-brand-cloud p-6 shadow-soft transition-shadow hover:shadow-lift"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-[10px] uppercase tracking-widest text-brand-slate/70">
                      {b.property.city} · {b.property.country}
                    </p>
                    <h2 className="display mt-1 text-2xl text-brand-ink">{b.property.name}</h2>
                  </div>
                  <ArrowUpRight className="text-brand-gold transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
                </div>

                <dl className="mt-5 grid grid-cols-3 gap-3">
                  <Mini label="TTM revenue" value={usd(b.ttmRevenue, { fractionDigits: 0 })} delta={b.revYoy} />
                  <Mini label="TTM NOI" value={usd(b.ttmNoi, { fractionDigits: 0 })} delta={b.noiYoy} />
                  <Mini
                    label="NOI margin"
                    value={pct(b.margin, { fractionDigits: 1 })}
                    delta={null}
                  />
                </dl>
              </Link>
            ))}
          </div>
        </Container>
      </main>
      <Footer />
    </>
  );
}

function Stat({ label, value }) {
  return (
    <div className="rounded-2xl border border-brand-tan/60 bg-brand-sand/40 p-5">
      <p className="text-xs uppercase tracking-[0.22em] text-brand-slate/70">{label}</p>
      <p className="display mt-2 text-3xl text-brand-ink">{value}</p>
    </div>
  );
}

function Mini({ label, value, delta }) {
  const positive = (delta ?? 0) >= 0;
  return (
    <div className="rounded-xl bg-brand-sand/40 px-3 py-2">
      <p className="text-[10px] uppercase tracking-widest text-brand-slate/70">{label}</p>
      <p className="display mt-0.5 text-base text-brand-ink">{value}</p>
      {Number.isFinite(delta) && (
        <p className={`text-[10px] ${positive ? 'text-brand-jade' : 'text-brand-terracotta'}`}>
          {(delta * 100).toFixed(1)}% YoY
        </p>
      )}
    </div>
  );
}
