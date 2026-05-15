import { redirect } from 'next/navigation';
import { NavBar } from '@/components/shared/NavBar';
import { Footer } from '@/components/shared/Footer';
import { AdminNav } from '@/components/shared/AdminNav';
import { ImportForm } from '@/components/economics/ImportForm';
import { isOwner } from '@/lib/admin/owner-auth';
import { PROPERTIES } from '@/lib/constants';

export const metadata = {
  title: 'Import T12',
  robots: { index: false, follow: false },
};

export default async function ImportPage({ searchParams }) {
  const auth = await isOwner();
  if (!auth.authed) redirect('/admin/login?redirect=/admin/import');
  const profile = auth.profile || { full_name: 'Owner', email: null };

  const sp = searchParams instanceof Promise ? await searchParams : searchParams;
  const initialSlug = (sp?.property || PROPERTIES[0].slug).toString();

  return (
    <>
      <NavBar />
      <main className="animate-page-in bg-brand-cloud pt-24 lg:pt-28">
        <div className="mx-auto flex max-w-[88rem]">
          <AdminNav profile={profile} />
          <div className="min-w-0 flex-1 px-5 py-10 sm:px-8 lg:px-10 max-w-3xl">
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
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
