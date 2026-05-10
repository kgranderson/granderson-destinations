import { cn } from '@/lib/utils/cn';

export function Marquee({ items = [], className, dim = false }) {
  const repeat = [...items, ...items];
  return (
    <div className={cn('group overflow-hidden border-y border-brand-tan/60 bg-brand-sand/30 py-6', className)}>
      <div className="flex w-max animate-marquee whitespace-nowrap gap-12 px-6 group-hover:[animation-play-state:paused]">
        {repeat.map((item, i) => (
          <span
            key={i}
            className={cn(
              'display text-2xl tracking-tight',
              dim ? 'text-brand-slate/60' : 'text-brand-ink',
            )}
          >
            {item}
            <span className="mx-6 text-brand-tan">/</span>
          </span>
        ))}
      </div>
    </div>
  );
}
