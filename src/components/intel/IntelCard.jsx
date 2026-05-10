import { ArrowUpRight, TrendingUp, TrendingDown, Minus } from 'lucide-react';

const IMPACT_STYLES = {
  positive: {
    chip: 'bg-brand-jade/15 text-brand-jade',
    icon: TrendingUp,
  },
  negative: {
    chip: 'bg-brand-terracotta/15 text-brand-terracotta',
    icon: TrendingDown,
  },
  mixed: {
    chip: 'bg-brand-gold/15 text-brand-gold',
    icon: Minus,
  },
};

export function IntelCard({ item }) {
  const style = IMPACT_STYLES[item.expectedImpact] || IMPACT_STYLES.mixed;
  const Icon = style.icon;

  return (
    <article className="rounded-2xl border border-brand-tan/60 bg-brand-cloud p-6 shadow-soft transition-shadow hover:shadow-lift">
      <div className="flex flex-wrap items-center gap-2">
        <span
          className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] uppercase tracking-widest ${style.chip}`}
        >
          <Icon size={11} /> {item.expectedImpact}
        </span>
        <span className="rounded-full border border-brand-tan px-2 py-0.5 text-[10px] uppercase tracking-widest text-brand-slate">
          {item.category}
        </span>
        <span className="rounded-full bg-brand-ink/5 px-2 py-0.5 text-[10px] uppercase tracking-widest text-brand-slate">
          {item.magnitude}
        </span>
        {item.earliestDate && (
          <span className="ml-auto text-[10px] uppercase tracking-widest text-brand-slate/60">
            {item.earliestDate}
            {item.latestDate && item.latestDate !== item.earliestDate ? ` → ${item.latestDate}` : ''}
          </span>
        )}
      </div>
      <h3 className="mt-3 text-lg font-medium text-brand-ink">{item.title}</h3>
      <p className="mt-2 text-sm leading-relaxed text-brand-slate">{item.summary}</p>
      {item.revenueThesis && (
        <p className="mt-3 border-l-2 border-brand-gold pl-3 text-xs italic leading-relaxed text-brand-ink/85">
          {item.revenueThesis}
        </p>
      )}
      {item.sourceUrl && (
        <a
          href={item.sourceUrl}
          target="_blank"
          rel="noreferrer noopener"
          className="mt-4 inline-flex items-center gap-1 text-xs text-brand-slate underline-offset-4 hover:text-brand-ink hover:underline"
        >
          {item.sourceTitle || 'Source'} <ArrowUpRight size={12} />
        </a>
      )}
    </article>
  );
}
