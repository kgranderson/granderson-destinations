/**
 * The Welcome Book link — an elegant card-style entry point to the
 * downloadable PDF guide for a property. Two actions: "Open" (opens
 * in a new tab) and "Download" (forces save). A tiny meta strip
 * underneath gives the page count and file size so a guest can
 * decide whether to read it on phone or save for later.
 *
 * Renders nothing if the property has no welcomeBook entry, so it
 * can be safely placed in the page tree for all properties.
 */
export function WelcomeBook({ property }) {
  const book = property?.welcomeBook;
  if (!book?.url) return null;

  return (
    <aside className="welcome-book mt-10 rounded-2xl border border-brand-slate/15 bg-brand-cloud p-6 sm:p-7">
      <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between sm:gap-8">
        <div className="flex items-start gap-4">
          <span className="text-brand-gold" aria-hidden>
            {/* Editorial book glyph in the brand's arch vocabulary —
                an open spine with a hairline ribbon. */}
            <svg viewBox="0 0 32 32" width="34" height="34">
              <path
                d="M 4 8 L 16 6 L 28 8 L 28 26 L 16 24 L 4 26 Z"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.4"
                strokeLinejoin="round"
              />
              <line x1="16" y1="6" x2="16" y2="24" stroke="currentColor" strokeWidth="1.2" />
              <line x1="20" y1="2"  x2="20" y2="11" stroke="currentColor" strokeWidth="1.2" />
              <polygon points="20,11 22,8 18,8" fill="currentColor" />
            </svg>
          </span>
          <div>
            <p className="text-[11px] uppercase tracking-[0.32em] text-brand-gold">
              The Welcome Book
            </p>
            <h3 className="display mt-2 text-xl text-brand-ink sm:text-2xl">
              Everything you&rsquo;ll want to know before you arrive.
            </h3>
            <p className="mt-2 text-sm text-brand-slate sm:text-[15px]">
              The {property.shortName || property.city} guide — house manual, local map, restaurant
              picks, and the rhythm of the home, set in the same editorial language as the stay.
            </p>
          </div>
        </div>

        <div className="flex shrink-0 flex-col gap-3 sm:items-end">
          <div className="flex gap-3">
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
    </aside>
  );
}
