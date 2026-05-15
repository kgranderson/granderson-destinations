import { notFound, redirect } from 'next/navigation';
import { NavBar } from '@/components/shared/NavBar';
import { Footer } from '@/components/shared/Footer';
import { Container } from '@/components/shared/Container';
import { listAllTickets, summarizeTickets } from '@/lib/maintenance/queries';
import { isOwner } from '@/lib/maintenance/owner-auth';
import { AdminBoard } from './AdminBoard';

export const metadata = {
  title: 'Maintenance · Admin',
  description: 'Owner dashboard for Granderson Destinations maintenance operations.',
};

export const dynamic = 'force-dynamic';

export default async function AdminPage({ searchParams }) {
  const sp = searchParams instanceof Promise ? await searchParams : searchParams;

  // If the owner arrived with ?key=..., forward them to the auth Route Handler
  // which is allowed to mutate cookies (RSCs can't). The handler will set the
  // httpOnly cookie and redirect back here without the secret in the URL.
  if (sp?.key) {
    redirect(`/api/maintenance/admin/auth?key=${encodeURIComponent(sp.key)}`);
  }

  const auth = await isOwner();
  if (!auth.authed) {
    // Hard fail to a 404 so the page doesn't reveal its existence.
    notFound();
  }

  const tickets = await listAllTickets({ limit: 500 });
  const kpi = summarizeTickets(tickets);

  return (
    <>
      <NavBar />
      <main className="animate-page-in bg-brand-cloud pt-32">
        <Container size="lg" className="pb-24">
          <div className="flex items-baseline justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.32em] text-brand-ink/75 font-medium">
                Granderson Destinations · Maintenance
              </p>
              <h1 className="display mt-2 text-display-lg text-brand-ink">Operations</h1>
              <p className="mt-2 text-brand-slate">
                {tickets.length} ticket{tickets.length === 1 ? '' : 's'} across the portfolio.
              </p>
            </div>
            <div className="text-xs text-brand-slate">
              <span className="inline-flex items-center gap-1.5">
                <span className="h-1.5 w-1.5 rounded-full bg-brand-jade" />
                Email live · SMS pending TCR
              </span>
            </div>
          </div>

          <AdminBoard tickets={tickets} kpi={kpi} />
        </Container>
      </main>
      <Footer />
    </>
  );
}
