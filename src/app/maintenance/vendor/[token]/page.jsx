import { notFound } from 'next/navigation';
import Link from 'next/link';
import { NavBar } from '@/components/shared/NavBar';
import { Footer } from '@/components/shared/Footer';
import { Container } from '@/components/shared/Container';
import { TicketTimeline } from '@/components/maintenance/TicketTimeline';
import { getTicketByVendorToken } from '@/lib/maintenance/queries';
import { STATUS_LABELS, VENDOR_TRANSITIONS, formatAge } from '@/lib/maintenance/status';
import { VendorActions } from './VendorActions';

export const metadata = {
  title: 'Vendor portal · Granderson Destinations',
  description: 'Update the status of your assigned maintenance ticket.',
};

// Token-based auth: the URL itself is the secret. We deliberately do not
// cache so vendor actions reflect immediately on reload.
export const dynamic = 'force-dynamic';

export default async function VendorPortalPage({ params }) {
  const p = params instanceof Promise ? await params : params;
  const ticket = await getTicketByVendorToken(p.token);
  if (!ticket) notFound();

  const allowedNext = VENDOR_TRANSITIONS[ticket.status] || [];
  const propertyLabel = ticket.property?.name
    ? `${ticket.property.name}${ticket.property.city ? ' · ' + ticket.property.city : ''}`
    : '—';

  return (
    <>
      <NavBar />
      <main className="animate-page-in bg-brand-cloud pt-32">
        <Container size="md" className="pb-24">
          <p className="text-xs uppercase tracking-[0.32em] text-brand-jade font-medium">
            Vendor portal · {ticket.vendor?.name || 'You'}
          </p>
          <h1 className="display mt-3 text-display-lg text-brand-ink">{ticket.title}</h1>
          <p className="mt-3 text-brand-slate">
            {propertyLabel}{ticket.category ? ` · ${ticket.category}` : ''} · reported {formatAge(ticket.created_at)} ago
          </p>

          <div className="mt-8 rounded-xl border border-brand-slate/15 bg-white p-8 shadow-sm">
            <div className="grid grid-cols-2 gap-6 text-sm">
              <div>
                <div className="text-xs uppercase tracking-widest text-brand-ink/70 font-medium">Current status</div>
                <div className="text-brand-ink font-medium mt-1">{STATUS_LABELS[ticket.status] || ticket.status}</div>
              </div>
              <div>
                <div className="text-xs uppercase tracking-widest text-brand-ink/70 font-medium">Severity</div>
                <div className="text-brand-ink font-medium mt-1">{ticket.severity ? `${ticket.severity}/5` : '—'} · {ticket.priority || 'normal'}</div>
              </div>
            </div>

            <div className="mt-6">
              <div className="text-xs uppercase tracking-widest text-brand-ink/70 font-medium">Timeline</div>
              <TicketTimeline status={ticket.status} history={ticket.status_history} />
            </div>

            <div className="mt-6 rounded-md bg-brand-sand px-4 py-3 text-sm text-brand-ink/85">
              <div className="text-xs uppercase tracking-widest text-brand-ink/70 font-medium mb-1">Guest description</div>
              <div className="leading-relaxed whitespace-pre-wrap">{ticket.description}</div>
            </div>

            {ticket.triage_meta?.reasoning && (
              <p className="mt-4 text-xs italic text-brand-slate">
                Why we routed this to you: {ticket.triage_meta.reasoning}
              </p>
            )}

            <hr className="my-8 border-brand-slate/10" />

            <VendorActions
              token={p.token}
              currentStatus={ticket.status}
              allowedNext={allowedNext}
              vendorNotes={ticket.vendor_notes || ''}
              costEstimateCents={ticket.cost_estimate_cents}
              costFinalCents={ticket.cost_final_cents}
              etaAt={ticket.eta_at}
            />
          </div>

          <p className="mt-10 text-xs text-brand-slate">
            Bookmark this URL — it's your unique link to this ticket. Anyone with this link can
            update the status, so don't share it. Questions? Reply to the dispatch email or call
            the owner directly.
          </p>
          <div className="mt-4">
            <Link href={`/maintenance/status/${ticket.id}`} className="text-xs text-brand-slate underline">
              View the guest-facing status page for this ticket
            </Link>
          </div>
        </Container>
      </main>
      <Footer />
    </>
  );
}
