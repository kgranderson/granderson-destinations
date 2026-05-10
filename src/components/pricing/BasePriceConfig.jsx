import { usd } from '@/lib/utils/format';

export function BasePriceConfig({ property }) {
  const base = property.baseAdrUsd || 600;
  // Suggested guardrails — final values will come from PriceLabs config.
  const min = Math.round(base * 0.6);
  const max = Math.round(base * 2.5);
  return (
    <div className="rounded-2xl border border-brand-tan/60 bg-brand-cloud p-5 shadow-soft">
      <h3 className="display text-xl text-brand-ink">Base price configuration</h3>
      <p className="mt-1 text-xs text-brand-slate">
        Editable from the PriceLabs dashboard. These values seed the dynamic pricing engine.
      </p>
      <dl className="mt-5 grid grid-cols-3 gap-4">
        <Cell label="Base ADR" value={usd(base)} accent="ink" />
        <Cell label="Min ADR" value={usd(min)} accent="slate" />
        <Cell label="Max ADR" value={usd(max)} accent="gold" />
      </dl>
      <p className="mt-4 text-xs text-brand-slate">
        Listing ID: <code className="rounded bg-brand-tan/40 px-1">{property.pricelabsListingId || '— not set —'}</code>
      </p>
    </div>
  );
}

function Cell({ label, value, accent }) {
  const colors = {
    ink: 'text-brand-ink bg-brand-sand/40',
    slate: 'text-brand-slate bg-brand-sand/40',
    gold: 'text-brand-gold bg-brand-gold/10',
  };
  return (
    <div className={`rounded-xl p-4 ${colors[accent] || colors.ink}`}>
      <dt className="text-[10px] uppercase tracking-widest text-brand-slate/70">{label}</dt>
      <dd className="display mt-1 text-2xl">{value}</dd>
    </div>
  );
}
