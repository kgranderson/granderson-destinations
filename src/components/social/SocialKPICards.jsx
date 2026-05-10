import { Heart, Eye, UserPlus, Bookmark, MessageCircle, Camera } from 'lucide-react';
import { compactNumber } from '@/lib/utils/format';

/**
 * Stub IG performance metrics. Replace with the live Meta Graph
 * Insights API once META_LONG_LIVED_TOKEN is configured.
 */
const STUB_METRICS = {
  followers:        { value: 12_842, deltaPct: 0.084 },
  monthlyReach:     { value: 184_201, deltaPct: 0.21 },
  monthlyImpr:      { value: 412_950, deltaPct: 0.18 },
  saves:            { value: 1_234,   deltaPct: 0.32 },
  monthlyEngage:    { value: 18_402,  deltaPct: 0.14 },
  postsPerMonth:    { value: 26,      deltaPct: 0.0  },
};

export function SocialKPICards() {
  const cards = [
    { label: 'Followers',          icon: UserPlus,    metric: STUB_METRICS.followers },
    { label: 'Monthly reach',      icon: Eye,         metric: STUB_METRICS.monthlyReach },
    { label: 'Monthly impressions',icon: Eye,         metric: STUB_METRICS.monthlyImpr },
    { label: 'Saves (30d)',        icon: Bookmark,    metric: STUB_METRICS.saves },
    { label: 'Engagements (30d)',  icon: Heart,       metric: STUB_METRICS.monthlyEngage },
    { label: 'Posts (30d)',        icon: Camera,      metric: STUB_METRICS.postsPerMonth },
  ];
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {cards.map((c) => (
        <Card key={c.label} {...c} />
      ))}
    </div>
  );
}

function Card({ label, icon: Icon, metric }) {
  const positive = metric.deltaPct >= 0;
  return (
    <div className="rounded-2xl border border-brand-tan/60 bg-brand-cloud p-5 shadow-soft">
      <div className="flex items-center justify-between">
        <p className="text-xs uppercase tracking-[0.22em] text-brand-slate/70">{label}</p>
        <Icon size={14} className="text-brand-slate" />
      </div>
      <p className="display mt-2 text-3xl text-brand-ink">{compactNumber(metric.value)}</p>
      <p className={`mt-1 text-xs font-medium ${positive ? 'text-brand-jade' : 'text-brand-terracotta'}`}>
        {positive ? '+' : ''}{(metric.deltaPct * 100).toFixed(1)}% MoM
      </p>
    </div>
  );
}
