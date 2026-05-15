import { redirect } from 'next/navigation';
import Link from 'next/link';
import { NavBar } from '@/components/shared/NavBar';
import { Footer } from '@/components/shared/Footer';
import { Container } from '@/components/shared/Container';
import { getAdminClient } from '@/lib/supabase/admin';
import { isOwner } from '@/lib/maintenance/owner-auth';
import { UsersManager } from './UsersManager';

export const metadata = {
  title: 'Maintenance · Admin users',
  description: 'Manage the email + password admin accounts for the operations dashboard.',
};

export const dynamic = 'force-dynamic';

export default async function UsersAdminPage() {
  const auth = await isOwner();
  if (!auth.authed) redirect('/maintenance/admin/login');

  const supabase = getAdminClient();
  const { data: users } = supabase
    ? await supabase
        .from('profiles')
        .select('id,email,full_name,tier,created_at')
        .eq('tier', 'admin')
        .order('created_at', { ascending: false })
    : { data: [] };

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
              <h1 className="display mt-2 text-display-lg text-brand-ink">Admin users</h1>
              <p className="mt-2 text-brand-slate">
                Anyone listed here can sign in with email + password and reach every page under{' '}
                <span className="font-mono text-sm">/maintenance/admin/*</span>. Create a new
                account for each staff member; revoke access by removing them.
              </p>
            </div>
            <Link href="/maintenance/admin" className="text-sm text-brand-slate underline-offset-4 hover:underline">
              ← Back to dashboard
            </Link>
          </div>

          <UsersManager initialUsers={users || []} currentUserId={auth.user?.id || null} />
        </Container>
      </main>
      <Footer />
    </>
  );
}
