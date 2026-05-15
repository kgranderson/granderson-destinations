import { redirect } from 'next/navigation';
import Link from 'next/link';
import { NavBar } from '@/components/shared/NavBar';
import { Footer } from '@/components/shared/Footer';
import { Container } from '@/components/shared/Container';
import { getAdminClient } from '@/lib/supabase/admin';
import { isOwner } from '@/lib/maintenance/owner-auth';
import { MAINTENANCE_CATEGORIES, PROPERTIES } from '@/lib/constants';
import { VendorsManager } from './VendorsManager';

export const metadata = {
  title: 'Maintenance · Vendors',
  description: 'Manage the maintenance vendor roster for Granderson Destinations properties.',
};

export const dynamic = 'force-dynamic';

export default async function VendorsAdminPage() {
  const auth = await isOwner();
  if (!auth.authed) redirect('/maintenance/admin/login');

  const supabase = getAdminClient();
  const { data: vendors } = supabase
    ? await supabase
        .from('maintenance_vendors')
        .select('id,name,phone,email,specialties,markets,notes,active,last_used_at,performance_score,created_at')
        .order('active', { ascending: false })
        .order('name', { ascending: true })
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
              <h1 className="display mt-2 text-display-lg text-brand-ink">Vendor roster</h1>
              <p className="mt-2 text-brand-slate">
                The trades and services Claude will route maintenance dispatch to. Add vendors
                manually below, or upload a spreadsheet to bulk-import.
              </p>
            </div>
            <Link href="/maintenance/admin" className="text-sm text-brand-slate underline-offset-4 hover:underline">
              ← Back to dashboard
            </Link>
          </div>

          <VendorsManager
            initialVendors={vendors || []}
            categories={MAINTENANCE_CATEGORIES}
            properties={PROPERTIES.map((p) => ({ slug: p.slug, name: p.name }))}
          />
        </Container>
      </main>
      <Footer />
    </>
  );
}
