import Link from 'next/link';
import { NavBar } from '@/components/shared/NavBar';
import { Footer } from '@/components/shared/Footer';
import { Container } from '@/components/shared/Container';
import { PROPERTIES, FEATURE_FLAGS } from '@/lib/constants';
import { SocialKPICards } from '@/components/social/SocialKPICards';
import { PostComposer } from '@/components/social/PostComposer';
import { PostCalendar } from '@/components/social/PostCalendar';
import { listPhotosForProperty } from '@/lib/social/photo-library';
import { buildCadence } from '@/lib/social/cadence';
import { HASHTAG_BANK } from '@/lib/social/hashtags';

export const revalidate = 600;

export const metadata = {
  title: 'Social engine',
  description: 'Instagram cadence + caption gen + hashtag strategy across the Granderson Destinations portfolio.',
  robots: { index: false, follow: false },
};

export default function SocialPage({ searchParams }) {
  const slug = searchParams?.property || PROPERTIES[0].slug;
  const property = PROPERTIES.find((p) => p.slug === slug) || PROPERTIES[0];
  const photos = listPhotosForProperty(property.slug);
  const cadence = buildCadence({ property, daysAhead: 28, photoLibrary: photos });
  const hashtags = HASHTAG_BANK[property.slug] || {};
  const isLive = FEATURE_FLAGS.metaIgLive();

  return (
    <>
      <NavBar />
      <main className="animate-page-in bg-brand-cloud pt-32">
        <Container className="pb-20">
          {/* Header */}
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="text-xs uppercase tracking-[0.32em] text-brand-slate/70">Social engine</p>
              <h1 className="display mt-3 text-display-lg text-brand-ink">@{property.slug.replace(/-/g, '')}</h1>
              <p className="mt-2 max-w-2xl text-sm text-brand-slate">
                Generate captions, schedule posts on the editorial cadence, and lock in event lead-ups.
                Hashtag strategy is tuned for local-search discovery in {property.city}.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              {!isLive && (
                <span className="rounded-full bg-brand-tan/60 px-3 py-1 text-[10px] uppercase tracking-widest text-brand-slate">
                  Stub · Meta Graph live when token is set
                </span>
              )}
              {/* Property switcher */}
              <div className="flex items-center gap-2 rounded-full border border-brand-tan/60 bg-brand-cloud p-1">
                {PROPERTIES.map((p) => (
                  <Link
                    key={p.slug}
                    href={`/social?property=${p.slug}`}
                    scroll={false}
                    className={`rounded-full px-3 py-1.5 text-xs ${
                      p.slug === property.slug
                        ? 'bg-brand-ink text-brand-cloud'
                        : 'text-brand-slate hover:text-brand-ink'
                    }`}
                  >
                    {p.shortName}
                  </Link>
                ))}
              </div>
            </div>
          </div>

          {/* Performance KPIs */}
          <div className="mt-10">
            <SocialKPICards />
          </div>

          {/* Composer */}
          <section className="mt-10">
            <h2 className="display text-display-md text-brand-ink">Compose a post</h2>
            <p className="mt-1 text-sm text-brand-slate">
              Pick a photo, set the theme, generate a caption, schedule. Hashtags auto-build from the
              market strategy.
            </p>
            <div className="mt-6">
              <PostComposer property={property} photos={photos} />
            </div>
          </section>

          {/* Calendar */}
          <section className="mt-10">
            <h2 className="display text-display-md text-brand-ink">Posting cadence</h2>
            <p className="mt-1 text-sm text-brand-slate">
              Recommended cadence for {property.shortName} — Tue/Thu/Sat editorial posts plus
              event lead-ups (21d / 14d / 7d / 1d before each anchor event in this market).
            </p>
            {!cadence.some((p) => p.kind === 'event') && (
              <p className="mt-3 inline-block rounded-full bg-brand-tan/40 px-3 py-1 text-[11px] uppercase tracking-widest text-brand-slate">
                No anchor events in the next 28 days · only editorial cadence shown
              </p>
            )}
            <div className="mt-6">
              <PostCalendar posts={cadence} />
            </div>
          </section>

          {/* Hashtag strategy */}
          <section className="mt-10">
            <h2 className="display text-display-md text-brand-ink">Hashtag strategy</h2>
            <p className="mt-1 text-sm text-brand-slate">
              Curated mix of location, aesthetic, seasonal, and branded tags. Capped at 6 per post —
              IG penalizes tag-spam in 2025+.
            </p>
            <div className="mt-6 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              {Object.entries(hashtags).map(([group, tags]) => (
                <div key={group} className="rounded-2xl border border-brand-tan/60 bg-brand-cloud p-5">
                  <p className="text-[10px] uppercase tracking-widest text-brand-slate/70">{group}</p>
                  <ul className="mt-3 flex flex-wrap gap-1.5">
                    {tags.map((t) => (
                      <li
                        key={t}
                        className="rounded-full border border-brand-tan/60 bg-brand-sand/40 px-2 py-0.5 text-[11px] text-brand-slate"
                      >
                        {t}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </section>
        </Container>
      </main>
      <Footer />
    </>
  );
}
