/**
 * Posting cadence engine — produces a 28-day forward schedule of
 * recommended posts per property based on:
 *  - target frequency (3–4 posts/week per property)
 *  - upcoming anchor events (force a post 21d, 14d, 7d, 1d before)
 *  - day-of-week patterns (Tue/Thu/Sat best for STR feeds)
 *  - rotation through theme buckets so the feed has variety
 */
import { addDays, format, isBefore, parseISO } from 'date-fns';
import { ANCHOR_EVENTS_SEED } from '@/lib/constants';

const THEMES = ['pool-or-courtyard', 'lifestyle', 'kitchen', 'golden-hour', 'neighborhood', 'detail'];
const POSTING_DAYS = [2, 4, 6]; // Tue, Thu, Sat (0=Sun)
const POSTING_HOUR_LOCAL = 18;  // 6 PM local

export function buildCadence({ property, daysAhead = 28, photoLibrary = [] }) {
  const out = [];
  const today = new Date();
  let themeIdx = 0;

  // 1) Regular cadence — Tue/Thu/Sat across the next 28 days
  for (let i = 0; i < daysAhead; i++) {
    const d = addDays(today, i);
    if (!POSTING_DAYS.includes(d.getDay())) continue;
    const photo = photoLibrary[(themeIdx + i) % Math.max(1, photoLibrary.length)] || null;
    out.push({
      id: `cad-${property.slug}-${format(d, 'yyyy-MM-dd')}`,
      scheduledAt: format(new Date(d.getFullYear(), d.getMonth(), d.getDate(), POSTING_HOUR_LOCAL), "yyyy-MM-dd'T'HH:mm:ssXXX"),
      property: property.slug,
      theme: THEMES[themeIdx % THEMES.length],
      photo,
      kind: 'cadence',
      status: 'scheduled-stub',
    });
    themeIdx++;
  }

  // 2) Event-anchored posts — 21d, 14d, 7d, 1d before each anchor event in this market
  const upcomingEvents = ANCHOR_EVENTS_SEED.filter(
    (e) =>
      e.market === property.slug &&
      isBefore(today, parseISO(e.startDate)) &&
      isBefore(parseISO(e.startDate), addDays(today, daysAhead + 30)),
  );
  for (const ev of upcomingEvents) {
    for (const lead of [21, 14, 7, 1]) {
      const postDate = addDays(parseISO(ev.startDate), -lead);
      if (postDate < today) continue;
      if (postDate > addDays(today, daysAhead)) continue;
      out.push({
        id: `evt-${property.slug}-${ev.slug}-${lead}d`,
        scheduledAt: format(new Date(postDate.getFullYear(), postDate.getMonth(), postDate.getDate(), POSTING_HOUR_LOCAL), "yyyy-MM-dd'T'HH:mm:ssXXX"),
        property: property.slug,
        theme: 'event',
        eventSlug: ev.slug,
        eventName: ev.name,
        kind: 'event',
        leadDays: lead,
        photo: photoLibrary[(themeIdx + lead) % Math.max(1, photoLibrary.length)] || null,
        status: 'scheduled-stub',
      });
      themeIdx++;
    }
  }

  // Dedup: when an event lead-up post lands on the same day as a
  // cadence post, the event wins (more time-relevant content).
  const eventDates = new Set(
    out.filter((p) => p.kind === 'event').map((p) => p.scheduledAt.slice(0, 10)),
  );
  const deduped = out.filter(
    (p) => !(p.kind === 'cadence' && eventDates.has(p.scheduledAt.slice(0, 10))),
  );

  return deduped.sort((a, b) => a.scheduledAt.localeCompare(b.scheduledAt));
}

export const POST_THEMES = THEMES;
