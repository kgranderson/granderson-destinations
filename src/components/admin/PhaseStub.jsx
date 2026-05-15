import Link from 'next/link';
import { CircleDashed } from 'lucide-react';

/**
 * Lightweight "coming soon" placeholder used by every marketing tab
 * that hasn't shipped yet. Keeps the AdminNav tab clickable instead
 * of 404'ing and gives the operator a clear sense of what's next.
 */
export function PhaseStub({ phase, title, description, propertySlug }) {
  return (
    <section className="mt-8 rounded-2xl border border-dashed border-brand-tan bg-brand-sand/20 p-8 text-center">
      <CircleDashed className="mx-auto text-brand-slate/60" size={28} />
      <p className="mt-3 text-[10px] uppercase tracking-[0.32em] text-brand-slate/60">
        Phase {phase} · Coming soon
      </p>
      <h2 className="display mt-2 text-display-md text-brand-ink">{title}</h2>
      <p className="mx-auto mt-3 max-w-md text-sm text-brand-slate">{description}</p>
      <Link
        href={`/admin/marketing/${propertySlug}/pricing`}
        className="mt-6 inline-block rounded-full border border-brand-ink px-5 py-2 text-xs font-medium text-brand-ink hover:bg-brand-ink hover:text-brand-cloud"
      >
        Back to Pricing
      </Link>
    </section>
  );
}
