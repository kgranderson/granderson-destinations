import { Trophy, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { usd, pct } from '@/lib/utils/format';

/**
 * AirDNA comp set comparison panel. Shows your property's ADR + RevPAR
 * vs. comp set median + top quartile, with percentile rank and the
 * "to-top-quartile" gap.
 */
export function CompPanel({ marketSummary, compRank, propertyAdr, propertyRevPar, isStub }) {
  const adrToTQ = compRank.topQuartileAdr ? propertyAdr - compRank.topQuartileAdr : null;
  const revParToTQ = compRank.topQuartileRevPar ? propertyRevPar - compRank.topQuartileRevPar : null;

  return (
    <div className="rounded-2xl border border-brand-tan/60 bg-brand-cloud p-5 shadow-soft">
      <div className="flex items-baseline justify-between">
        <h3 className="display text-xl text-brand-ink">Comp set · AirDNA</h3>
        {isStub && (
          <span className="rounded-full bg-brand-tan/60 px-2 py-0.5 text-[10px] uppercase tracking-widest text-brand-slate">
            Stub
          </span>
        )}
      </div>
      <p className="mt-1 text-xs text-brand-slate">
        Your trailing-30 ADR + RevPAR vs. the {marketSummary?.activeListings?.toLocaleString() ?? '—'} active comparable listings in the market.
      </p>

      <div className="mt-5 grid gap-4 sm:grid-cols-2">
        <Block
          title="ADR"
          you={propertyAdr}
          median={compRank.medianAdr}
          tq={compRank.topQuartileAdr}
          percentile={compRank.adrPct}
          gap={adrToTQ}
        />
        <Block
          title="RevPAR"
          you={propertyRevPar}
          median={compRank.medianRevPar}
          tq={compRank.topQuartileRevPar}
          percentile={compRank.revParPct}
          gap={revParToTQ}
        />
      </div>

      {/* Top-quartile target callout */}
      <div
        className={`mt-5 flex items-start gap-3 rounded-xl border p-4 ${
          (compRank.adrPct ?? 0) >= 0.75
            ? 'border-brand-jade/40 bg-brand-jade/10'
            : 'border-brand-gold/40 bg-brand-gold/10'
        }`}
      >
        <Trophy
          size={18}
          className={(compRank.adrPct ?? 0) >= 0.75 ? 'text-brand-jade' : 'text-brand-gold'}
        />
        <div className="text-sm">
          <p className="font-medium text-brand-ink">
            {(compRank.adrPct ?? 0) >= 0.75
              ? 'You\'re in the top quartile.'
              : `${Math.round((1 - (compRank.adrPct ?? 0)) * 100)}% of the comp set still earns more than you on ADR.`}
          </p>
          <p className="mt-1 text-brand-slate">
            {adrToTQ != null && adrToTQ < 0
              ? `Closing ${usd(Math.abs(adrToTQ))} on ADR would put you at the top-quartile threshold.`
              : 'Defend the position — small ADR concessions compound.'}
          </p>
        </div>
      </div>
    </div>
  );
}

function Block({ title, you, median, tq, percentile, gap }) {
  return (
    <div className="rounded-xl bg-brand-sand/40 p-4">
      <p className="text-[10px] uppercase tracking-widest text-brand-slate/70">{title}</p>
      <p className="display mt-1 text-2xl text-brand-ink">{usd(you, { fractionDigits: 0 })}</p>
      <p className="mt-1 text-xs text-brand-slate">
        Median {usd(median, { fractionDigits: 0 })} · Top-Q {usd(tq, { fractionDigits: 0 })}
      </p>
      <div className="mt-3 flex items-center justify-between text-xs">
        <span className="rounded-full bg-brand-cloud px-2 py-0.5 text-brand-ink">
          {percentile != null ? `${Math.round(percentile * 100)}th pct` : '—'}
        </span>
        {gap != null && (
          <span
            className={`inline-flex items-center gap-1 ${
              gap >= 0 ? 'text-brand-jade' : 'text-brand-terracotta'
            }`}
          >
            {gap >= 0 ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
            {usd(Math.abs(gap), { fractionDigits: 0 })} vs. Top-Q
          </span>
        )}
      </div>
    </div>
  );
}
