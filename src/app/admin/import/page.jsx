import Link from 'next/link';
import { redirect } from 'next/navigation';
import { NavBar } from '@/components/shared/NavBar';
import { Footer } from '@/components/shared/Footer';
import { Container } from '@/components/shared/Container';
import { ImportForm } from '@/components/economics/ImportForm';
import { getServerClient } from '@/lib/supabase/server';
import { PROPERTIES } from '@/lib/constants';

export const metadata = {
  title: 'Import T12',
  robots: { index: false, follow: false },
};

export default async function ImportPage({ searchParams }) {
  // Server-side gate: require an admin session
  const supabase = getServerClient();
  if (!supabase) {
    redirect('/auth/login?redirect=/admin/import');
  }
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    redirect('/auth/login?redirect=/admin/import');
  }
  const { data: profile } = await supabase
    .from('profiles')
    .select('tier')
    .eq('id', user.id)
    .maybeSingle();
  if (!profile || profile.tier !== 'admin') {
    return (
      <>
        <NavBar />
        <main className="animate-page-in pt-32">
          <Container size="sm" className="pb-20">
            <p className="text-xs uppercase tracking-[0.32em] text-brand-slate/70">Forbidden</p>
            <h1 className="display mt-3 text-display-lg text-brand-ink">Admin access required</h1>
            <p className="mt-3 text-brand-slate">
              Your account exists but isn&rsquo;t on the admin list. Reach out to the operator to
              grant admin tier, then refresh.
            </p>
            <Link
              href="/"
              className="mt-6 inline-block rounded-full bg-brand-ink px-5 py-2.5 text-sm text-brand-cloud"
            >
              Back home
            </Link>
          </Container>
        </main>
        <Footer />
      </>
    );
  }

  const initialSlug = (searchParams?.property || PROPERTIES[0].slug).toString();

  return (
    <>
      <NavBar />
      <main className="animate-page-in pt-32">
        <Container size="md" className="pb-20">
          <p className="text-xs uppercase tracking-[0.32em] text-brand-slate/70">Admin · Import</p>
          <h1 className="display mt-3 text-display-lg text-brand-ink">Import T12 financials</h1>
          <p className="mt-4 max-w-2xl text-brand-slate">
            Upload a P&L export from Rent Manager (Excel or CSV). We&rsquo;ll auto-detect long vs
            wide format, validate every row, and replace any existing data for the months in your
            file. Dashboard refreshes within seconds of a successful import.
          </p>

          <div className="mt-8">
            <ImportForm initialSlug={initialSlug} />
          </div>

          <details className="mt-10 rounded-2xl border border-brand-tan/60 bg-brand-sand/40 p-5">
            <summary className="cursor-pointer text-sm font-medium text-brand-ink">
              Accepted file formats
            </summary>
            <div className="mt-3 space-y-3 text-sm text-brand-slate">
              <p>
                <strong>Long format</strong> (one row per line item):
              </p>
              <pre className="overflow-x-auto rounded-md bg-brand-cloud p-3 text-xs">{`month,type,category,amount
2025-07,revenue,,52400
2025-07,expense,Cleaning,6030
2025-07,expense,Property management,4192`}</pre>
              <p>
                <strong>Wide format</strong> (one row per month, columns are categories):
              </p>
              <pre className="overflow-x-auto rounded-md bg-brand-cloud p-3 text-xs">{`month,revenue,Cleaning,Property management,Utilities,Maintenance
2025-07,52400,6030,4192,2882,2096
2025-08,48100,5510,3850,3120,1840`}</pre>
              <p>
                Excel exports from Rent Manager typically come in wide format. Either works — we
                detect by looking at the header row. Negative numbers in parentheses{' '}
                <code className="rounded bg-brand-tan/40 px-1">(1,234)</code> are correctly read
                as negative.
              </p>
            </div>
          </details>
        </Container>
      </main>
      <Footer />
    </>
  );
}
