import { notFound, redirect } from 'next/navigation';
import Link from 'next/link';
import { NavBar } from '@/components/shared/NavBar';
import { Footer } from '@/components/shared/Footer';
import { Container } from '@/components/shared/Container';
import { listAllTickets, summarizeTickets } from '@/lib/maintenance/queries';
import { isOwner } from '@/lib/maintenance/owner-auth';
import { AdminBoard } from './AdminBoard';
import { SignOutButton } from './SignOutButton';

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
    // Unauthed visitors get bounced to the sign-in page rather than a 404.
    // The login page itself doesn't reveal whether the admin system has any
    // accounts yet, so this doesn't materially help an attacker discover
    // anything they couldn't already discover by hitting /maintenance/admin/login.
    redirect('/maintenance/admin/login');
  }

  const tickets = await listAllTickets({ limit: 500 });
  const kpi = summarizeTickets(tickets);

  // Who's signed in? Use the profile name if available, otherwise the email,
  // otherwise nothing (legacy-cookie path has no user identity).
  const signedInAs =
    auth.profile?.full_name ||
    auth.profile?.email ||
    (auth.via === 'legacy' ? 'Owner (legacy token)' : null);

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
            <div className="flex items-end flex-col gap-2 sm:items-center sm:flex-row sm:gap-3">
              <Link
                href="/maintenance/admin/vendors"
                className="rounded-full border border-brand-ink/30 px-4 py-1.5 text-xs text-brand-ink hover:bg-brand-cloud">
                Manage vendors →
              </Link>
              <Link
                href="/maintenance/admin/users"
                className="rounded-full border border-brand-ink/30 px-4 py-1.5 text-xs text-brand-ink hover:bg-brand-cloud">
                Manage admins →
              </Link>
              {signedInAs && (
                <span className="text-xs text-brand-slate">
                  Signed in as <span className="font-medium text-brand-ink">{signedInAs}</span>
                </span>
              )}
              <SignOutButton />
              <span className="inline-flex items-center gap-1.5 text-xs text-brand-slate">
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
