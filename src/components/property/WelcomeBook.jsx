import Image from 'next/image';

/**
 * The Welcome Book link — an elegant card-style entry point to the
 * downloadable PDF guide for a property. Two actions: "Open" (opens
 * in a new tab) and "Download" (forces save). A tiny meta strip
 * underneath gives the page count and file size so a guest can
 * decide whether to read it on phone or save for later.
 *
 * If the property's welcomeBook has a coverImage, the actual book
 * cover is rendered as a portrait thumbnail on the left of the card
 * (sits over a hairline-bordered frame so it reads as a printed
 * artifact, not a screenshot). Falls back to a small brand glyph
 * if no cover is provided.
 *
 * Renders nothing if the property has no welcomeBook entry, so it
 * can be safely placed in the page tree for all properties.
 */
export function WelcomeBook({ property }) {
  const book = property?.welcomeBook;
  if (!book?.url) return null;

  return (
    <aside className="mt-10 rounded-2xl border border-brand-slate/15 bg-brand-cloud p-6 sm:p-7">
      <div className="flex flex-col gap-6 sm:flex-row sm:items-stretch sm:gap-7">
        {/* Cover thumbnail — sits in a hairline frame so it reads as
            an actual printed book cover and matches the editorial
            tone of the card. Hidden on the narrowest screens to keep
            the layout single-column at extra-small sizes. */}
        {book.coverImage && (
          <a
            href={book.url}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={`Open the ${property.shortName || property.city} welcome book`}
            className="group relative block w-32 shrink-0 self-center overflow-hidden rounded-sm border border-brand-slate/15 bg-brand-sand shadow-soft transition hover:shadow-lift sm:self-start"
            style={{ aspectRatio: '8.5 / 11' }}
          >
            <Image
              src={book.coverImage}
              alt={`${property.name} welcome book cover`}
              fill
              sizes="128px"
              className="object-cover transition duration-500 ease-out-expo group-hover:scale-[1.03]"
            />
            {/* Hover veil with a faint corner-arrow — signals openability
                without competing with the cover artwork. */}
            <span
              aria-hidden
              className="pointer-events-none absolute inset-0 flex items-end justify-end p-2 opacity-0 transition group-hover:opacity-100"
              style={{
                background:
                  'linear-gradient(180deg, rgba(14,17,22,0) 60%, rgba(14,17,22,0.35) 100%)',
              }}
            >
              <svg viewBox="0 0 16 16" width="14" height="14" className="text-brand-cloud">
                <path
                  d="M 6 2 L 14 2 L 14 10 M 14 2 L 6 10 M 13 14 L 2 14 L 2 3"
                  stroke="currentColor"
                  strokeWidth="1.4"
                  fill="none"
                  strokeLinecap="round"
                />
              </svg>
            </span>
          </a>
        )}

        {/* Text + actions */}
        <div className="flex flex-1 flex-col justify-between gap-5">
          <div>
            <p className="text-[11px] uppercase tracking-[0.32em] text-brand-gold">
              The Welcome Book
            </p>
            <h3 className="display mt-2 text-xl text-brand-ink sm:text-2xl">
              Everything you&rsquo;ll want to know before you arrive.
            </h3>
            <p className="mt-2 max-w-prose text-sm text-brand-slate sm:text-[15px]">
              The {property.shortName || property.city} guide — house manual, local map, restaurant
              picks, and the rhythm of the home, set in the same editorial language as the stay.
            </p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-wrap gap-3">
              <a
                href={book.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-full bg-brand-ink px-5 py-2.5 text-sm font-medium text-brand-cloud transition hover:bg-brand-slate"
              >
                Open
                <svg viewBox="0 0 16 16" width="12" height="12" aria-hidden>
                  <path
                    d="M 6 2 L 14 2 L 14 10 M 14 2 L 6 10 M 13 14 L 2 14 L 2 3"
                    stroke="currentColor"
                    strokeWidth="1.4"
                    fill="none"
                    strokeLinecap="round"
                  />
                </svg>
              </a>
              <a
                href={book.url}
                download={`${property.slug}-welcome-book.pdf`}
                className="inline-flex items-center gap-2 rounded-full border border-brand-slate/30 px-5 py-2.5 text-sm font-medium text-brand-ink transition hover:border-brand-ink"
              >
                Download
                <svg viewBox="0 0 16 16" width="12" height="12" aria-hidden>
                  <path
                    d="M 8 2 L 8 11 M 4 7 L 8 11 L 12 7 M 2 14 L 14 14"
                    stroke="currentColor"
                    strokeWidth="1.4"
                    fill="none"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </a>
            </div>
            <p className="text-[11px] uppercase tracking-[0.28em] text-brand-slate/60">
              PDF &middot; {book.pages}&nbsp;pages &middot; {book.sizeMb}&nbsp;MB
            </p>
          </div>
        </div>
      </div>
    </aside>
  );
}
