import Image from 'next/image';
import { CalendarDays, Sparkles, AlarmClock } from 'lucide-react';

const THEME_STYLE = {
  'pool-or-courtyard': 'bg-brand-jade/15 text-brand-jade',
  lifestyle: 'bg-brand-rose/15 text-brand-rose',
  kitchen: 'bg-brand-gold/15 text-brand-gold',
  'golden-hour': 'bg-brand-terracotta/15 text-brand-terracotta',
  neighborhood: 'bg-brand-slate/15 text-brand-slate',
  detail: 'bg-brand-tan/60 text-brand-slate',
  event: 'bg-brand-ink text-brand-cloud',
};

export function PostCalendar({ posts = [] }) {
  if (!posts.length) {
    return (
      <div className="rounded-2xl border border-brand-tan/60 bg-brand-cloud p-5 shadow-soft">
        <h3 className="display text-xl text-brand-ink">No posts scheduled</h3>
        <p className="mt-2 text-sm text-brand-slate">
          Generate a caption above and click Schedule to add it to the cadence.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-brand-tan/60 bg-brand-cloud p-5 shadow-soft">
      <div className="flex items-center gap-2">
        <CalendarDays size={18} className="text-brand-ink" />
        <h3 className="display text-xl text-brand-ink">Cadence · next 28 days</h3>
        <span className="ml-auto rounded-full bg-brand-tan/60 px-2 py-0.5 text-[10px] uppercase tracking-widest text-brand-slate">
          {posts.length} scheduled
        </span>
      </div>

      <ul className="mt-4 divide-y divide-brand-tan/60">
        {posts.map((p) => {
          const dt = new Date(p.scheduledAt);
          const dateStr = dt.toLocaleDateString('en-US', {
            weekday: 'short',
            month: 'short',
            day: 'numeric',
          });
          const timeStr = dt.toLocaleTimeString('en-US', {
            hour: 'numeric',
            minute: '2-digit',
          });
          return (
            <li key={p.id} className="flex items-center gap-4 py-3">
              <div className="w-24 shrink-0">
                <p className="text-sm font-medium text-brand-ink">{dateStr}</p>
                <p className="text-xs text-brand-slate">{timeStr}</p>
              </div>

              {p.photo?.src ? (
                <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-md bg-brand-sand">
                  <Image src={p.photo.src} alt="" fill sizes="56px" className="object-cover" />
                </div>
              ) : (
                <div className="h-14 w-14 shrink-0 rounded-md bg-brand-sand/60" />
              )}

              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span
                    className={`rounded-full px-2 py-0.5 text-[10px] uppercase tracking-widest ${
                      THEME_STYLE[p.theme] || 'bg-brand-tan/60 text-brand-slate'
                    }`}
                  >
                    {p.theme}
                  </span>
                  {p.kind === 'event' && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-brand-ink/10 px-2 py-0.5 text-[10px] uppercase tracking-widest text-brand-slate">
                      <AlarmClock size={10} /> {p.leadDays}d before
                    </span>
                  )}
                </div>
                <p className="mt-1 text-sm text-brand-ink">
                  {p.kind === 'event' ? `Lead-up · ${p.eventName}` : 'Editorial cadence'}
                </p>
              </div>

              <span className="hidden text-[10px] uppercase tracking-widest text-brand-slate/60 sm:block">
                <Sparkles size={10} className="inline" /> {p.status === 'scheduled-stub' ? 'Queued' : p.status}
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
