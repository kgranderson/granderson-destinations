import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { NavBar } from '@/components/shared/NavBar';
import { Footer } from '@/components/shared/Footer';
import { Container } from '@/components/shared/Container';
import { EventCalculator } from '@/components/events/EventCalculator';
import { ANCHOR_EVENTS_SEED, PROPERTIES, MARKETS } from '@/lib/constants';
import { EVENT_DETAILS } from '@/lib/events/data';
import { eventJsonLd } from '@/lib/seo/jsonLd';
import { dateRange } from '@/lib/utils/format';
import { Clock, MapPin, Ticket, Users } from 'lucide-react';

export const revalidate = 3600;

export async function generateStaticParams() {
  return ANCHOR_EVENTS_SEED.map((e) => ({ slug: e.slug }));
}

export async function generateMetadata({ params }) {
  const event = ANCHOR_EVENTS_SEED.find((e) => e.slug === params.slug);
  const detail = EVENT_DETAILS[params.slug];
  if (!event) return {};
  return {
    title: event.name,
    description: detail?.heroSummary,
    openGraph: {
      title: `${event.name} · ${dateRange(event.startDate, event.endDate)}`,
      description: detail?.heroSummary,
      images: detail?.image ? [{ url: detail.image, width: 1600, height: 1067 }] : [],
    },
    twitter: {
      card: 'summary_large_image',
      title: event.name,
      description: detail?.heroSummary,
      images: detail?.image ? [detail.image] : [],
    },
  };
}

export default function EventDetailPage({ params }) {
  const event = ANCHOR_EVENTS_SEED.find((e) => e.slug === params.slug);
  if (!event) notFound();
  const detail = EVENT_DETAILS[params.slug] || {};
  const property = PROPERTIES.find((p) => p.slug === event.market);
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://granderson-destinations.vercel.app';
  const ld = eventJsonLd({
    event,
    baseUrl,
    venue: detail.venue,
    marketLabel: MARKETS[event.market]?.label,
  });

  return (
    <>
      <script
        type="application/ld+json"
        // eslint-disable-next-line react/no-danger
        dangerouslySetInnerHTML={{ __html: JSON.stringify(ld) }}
      />
      <NavBar />
      <main className="animate-page-in">
        {/* Hero */}
        <section className="relative isolate overflow-hidden bg-brand-ink text-brand-cloud">
          {detail.image && (
            <div aria-hidden className="absolute inset-0 -z-10">
              <Image src={detail.image} alt="" fill priority sizes="100vw" className="object-cover opacity-65" />
              <div className="hero-overlay absolute inset-0" />
            </div>
          )}
          <Container className="relative flex min-h-[70vh] flex-col justify-end pb-16 pt-40">
            <p className="text-xs uppercase tracking-[0.32em] text-brand-cloud/80">
              {event.market.replace(/-/g, ' ')} · {dateRange(event.startDate, event.endDate)}
            </p>
            <h1 className="display mt-3 max-w-4xl text-display-xl text-brand-cloud">{event.name}</h1>
            {detail.heroSummary && (
              <p className="mt-4 max-w-2xl text-base leading-relaxed text-brand-cloud/85 sm:text-lg">
                {detail.heroSummary}
              </p>
            )}

            {/* Stats row */}
            <dl className="mt-8 grid max-w-3xl grid-cols-2 gap-x-8 gap-y-4 text-sm sm:grid-cols-4">
              <Stat icon={MapPin} label="Venue" value={detail.venue} />
              <Stat icon={Users} label="Attendance" value={detail.expectedAttendance} />
              <Stat icon={Clock} label="Book by" value={detail.bookingLeadDays ? `${detail.bookingLeadDays}+ days out` : '—'} />
              <Stat icon={Ticket} label="Tickets" value={detail.ticketsUrl ? 'Open' : 'Free / public'} />
            </dl>
          </Container>
        </section>

        {/* Body + Calculator */}
        <section className="bg-brand-cloud py-20 sm:py-24">
          <Container>
            <div className="grid gap-12 md:grid-cols-12">
              <article className="md:col-span-7">
                <p className="text-xs uppercase tracking-[0.32em] text-brand-slate/70">The window</p>
                <h2 className="display mt-3 text-display-md text-brand-ink">Why this matters for revenue.</h2>
                {(detail.body ?? []).map((p, i) => (
                  <p key={i} className="mt-4 leading-relaxed text-brand-slate">
                    {p}
                  </p>
                ))}
                {detail.operatingPlaybook?.length ? (
                  <>
                    <h3 className="display mt-10 text-2xl text-brand-ink">Operating playbook</h3>
                    <ul className="mt-3 space-y-2 text-sm text-brand-ink">
                      {detail.operatingPlaybook.map((p) => (
                        <li key={p} className="flex gap-3">
                          <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-brand-gold" />
                          <span>{p}</span>
                        </li>
                      ))}
                    </ul>
                  </>
                ) : null}
                {detail.ticketsUrl && (
                  <a
                    href={detail.ticketsUrl}
                    target="_blank"
                    rel="noreferrer noopener"
                    className="mt-8 inline-block rounded-full border border-brand-ink px-6 py-3 text-sm font-medium text-brand-ink hover:bg-brand-ink hover:text-brand-cloud"
                  >
                    Official site →
                  </a>
                )}
              </article>

              <aside className="md:col-span-5">
                <EventCalculator event={event} baseAdrUsd={property?.baseAdrUsd ?? 720} />
              </aside>
            </div>
          </Container>
        </section>

        {/* Stay-during-event CTA */}
        {property && (
          <section className="bg-brand-ink py-20 text-brand-cloud">
            <Container size="md">
              <div className="rounded-3xl bg-brand-cloud/5 p-10 sm:p-14">
                <p className="text-xs uppercase tracking-[0.32em] text-brand-cloud/70">Stay during {event.name}</p>
                <h2 className="display mt-3 max-w-2xl text-display-md text-brand-cloud">
                  We block out concierge dates during this window. Book early.
                </h2>
                <Link
                  href={`/destinations/${property.slug}`}
                  className="mt-8 inline-block rounded-full bg-brand-cloud px-7 py-3 text-sm font-medium text-brand-ink hover:bg-brand-tan"
                >
                  See {property.name} →
                </Link>
              </div>
            </Container>
          </section>
        )}
      </main>
      <Footer />
    </>
  );
}

function Stat({ icon: Icon, label, value }) {
  return (
    <div>
      <dt className="flex items-center gap-1 text-[10px] uppercase tracking-[0.24em] text-brand-cloud/60">
        <Icon size={12} /> {label}
      </dt>
      <dd className="mt-1 text-sm text-brand-cloud">{value || '—'}</dd>
    </div>
  );
}
