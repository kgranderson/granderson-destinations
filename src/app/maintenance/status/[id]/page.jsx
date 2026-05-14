import Link from 'next/link';
import { NavBar } from '@/components/shared/NavBar';
import { Footer } from '@/components/shared/Footer';
import { Container } from '@/components/shared/Container';
import { TicketTimeline } from '@/components/maintenance/TicketTimeline';
import { getTicketById } from '@/lib/maintenance/queries';
import { STATUS_LABELS, formatAge } from '@/lib/maintenance/status';

export const metadata = {
  title: 'Maintenance ticket status',
  description: 'Track the status of your maintenance request with Granderson Destinations.',
};

// The status page is server-rendered so we can use Supabase service role
// without exposing keys to the client. Cached at the edge for 10s so
// repeated page loads while watching a ticket don't hammer the DB.
export const revalidate = 10;

function formatCurrency(cents) {
  if (cents == null) return null;
  return `$${(cents / 100).toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;
}

export default async function MaintenanceStatusPage({ params }) {
  // Next 15+ async params
  const p = params instanceof Promise ? await params : params;
  const ticket = await getTicketById(p.id);

  if (!ticket) {
    return (
      <>
        <NavBar />
        <main className="min-h-[70vh] bg-brand-cloud pt-32">
          <Container size="md" className="pb-24 text-center">
            <p className="text-xs uppercase tracking-[0.32em] text-brand-slate/70">Maintenance</p>
            <h1 className="display mt-3 text-display-lg text-brand-ink">Ticket not found</h1>
            <p className="mt-4 text-brand-slate">
              The status link may have expired, or the ticket was archived. If you submitted a
              report and need a fresh link, submit again or email{' '}
              <a href="mailto:hello@destinationgh.com" className="underline">hello@destinationgh.com</a>.
            </p>
            <div className="mt-8">
              <Link href="/maintenance/report" className="rounded-full bg-brand-ink px-6 py-3 text-sm text-brand-cloud">
                Report a new issue
              </Link>
            </div>
          </Container>
        </main>
        <Footer />
      </>
    );
  }

  const propertyLabel = ticket.property?.name
    ? `${ticket.property.name}${ticket.property.city ? ' · ' + ticket.property.city : ''}`
    : '—';

  return (
    <>
      <NavBar />
      <main className="animate-page-in bg-brand-cloud pt-32">
        <Container size="md" className="pb-24">
          <p className="text-xs uppercase tracking-[0.32em] text-brand-ink/75 font-medium">
            Ticket · {ticket.id.slice(0, 8)}
          </p>
          <h1 className="display mt-3 text-display-lg text-brand-ink">{ticket.title}</h1>
          <p className="mt-3 text-brand-slate">
            {propertyLabel}{ticket.category ? ` · ${ticket.category}` : ''}
          </p>

          <div className="mt-8 rounded-xl border border-brand-slate/15 bg-white p-8 shadow-sm">
            <div className="grid grid-cols-2 gap-6 sm:grid-cols-4 text-sm">
              <div>
                <div className="text-xs uppercase tracking-widest text-brand-ink/70 font-medium">Status</div>
                <div className="text-brand-ink font-medium mt-1">{STATUS_LABELS[ticket.status] || ticket.status}</div>
              </div>
              <div>
                <div className="text-xs uppercase tracking-widest text-brand-ink/70 font-medium">Severity</div>
                <div className="text-brand-ink font-medium mt-1">{ticket.severity ? `${ticket.severity}/5` : '—'}{ticket.priority ? ` · ${ticket.priority}` : ''}</div>
              </div>
              <div>
                <div className="text-xs uppercase tracking-widest text-brand-ink/70 font-medium">Vendor</div>
                <div className="text-brand-ink font-medium mt-1">{ticket.vendor?.name || <span className="opacity-60 font-normal">Matching…</span>}</div>
              </div>
              <div>
                <div className="text-xs uppercase tracking-widest text-brand-ink/70 font-medium">Reported</div>
                <div className="text-brand-ink font-medium mt-1">{formatAge(ticket.created_at)} ago</div>
              </div>
            </div>

            <div className="mt-8">
              <div className="text-xs uppercase tracking-widest text-brand-ink/70 font-medium">Timeline</div>
              <TicketTimeline status={ticket.status} history={ticket.status_history} />
            </div>

            {ticket.eta_at && (
              <p className="mt-6 rounded-md bg-brand-jade/10 px-4 py-3 text-sm text-brand-ink">
                Vendor ETA: <span className="font-medium">{new Date(ticket.eta_at).toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' })}</span>
              </p>
            )}

            {ticket.cost_estimate_cents != null && (
              <p className="mt-4 text-sm text-brand-slate">
                Estimated cost: <span className="font-medium text-brand-ink">{formatCurrency(ticket.cost_estimate_cents)}</span>
                {ticket.cost_final_cents != null && (
                  <> · Final cost: <span className="font-medium text-brand-ink">{formatCurrency(ticket.cost_final_cents)}</span></>
                )}
              </p>
            )}

            <div className="mt-8 rounded-md bg-brand-sand px-4 py-3 text-sm text-brand-ink/85">
              <div className="text-xs uppercase tracking-widest text-brand-ink/70 font-medium mb-1">Your description</div>
              <div className="leading-relaxed">{ticket.description}</div>
            </div>

            {ticket.vendor_notes && (
              <div className="mt-4 rounded-md border border-brand-jade/20 bg-brand-jade/5 px-4 py-3 text-sm text-brand-ink/85">
                <div className="text-xs uppercase tracking-widest text-brand-jade font-medium mb-1">Note from vendor</div>
                <div className="leading-relaxed whitespace-pre-wrap">{ticket.vendor_notes}</div>
              </div>
            )}

            {Array.isArray(ticket.photos) && ticket.photos.length > 0 && (
              <div className="mt-6">
                <div className="text-xs uppercase tracking-widest text-brand-ink/70 font-medium mb-2">Photos</div>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {ticket.photos.map((src, idx) => (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img key={idx} src={src} alt="" className="aspect-square w-full object-cover rounded-md" />
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="mt-8 flex gap-3">
            <Link href="/maintenance/report" className="rounded-full border border-brand-ink/20 px-5 py-2.5 text-sm text-brand-ink">
              Report another issue
            </Link>
            <a href="mailto:hello@destinationgh.com" className="rounded-full border border-brand-ink/20 px-5 py-2.5 text-sm text-brand-ink">
              Contact us
            </a>
          </div>

          <p className="mt-10 text-xs text-brand-slate">
            This page auto-refreshes when the vendor updates the ticket. Bookmark this URL to come
            back later.
          </p>
        </Container>
      </main>
      <Footer />
    </>
  );
}
