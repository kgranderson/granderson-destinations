import { NavBar } from '@/components/shared/NavBar';
import { Footer } from '@/components/shared/Footer';
import { Container } from '@/components/shared/Container';
import { PROPERTIES } from '@/lib/constants';
import { ReportForm } from './ReportForm';

export const metadata = {
  title: 'Report a maintenance issue',
  description:
    'Tell us what needs attention and we’ll route it to the right vendor immediately.',
};

export default function MaintenanceReportPage({ searchParams }) {
  // `searchParams` is async in Next 15+. The shared NavBar/Footer/Container
  // are server components so this stays a server page.
  const sp = searchParams instanceof Promise ? null : searchParams;
  const defaultProperty = sp?.property || sp?.p || PROPERTIES[0].slug;
  const reportedBy = sp?.as === 'manager' || sp?.as === 'owner' ? sp.as : 'guest';

  return (
    <>
      <NavBar />
      <main className="animate-page-in bg-brand-cloud pt-32">
        <Container size="md" className="pb-24">
          <p className="text-xs uppercase tracking-[0.32em] text-brand-ink/75 font-medium">
            Maintenance · {reportedBy === 'guest' ? 'In-stay' : reportedBy === 'manager' ? 'Property manager' : 'Owner'}
          </p>
          <h1 className="display mt-3 text-display-lg text-brand-ink">
            Tell us what needs attention.
          </h1>
          <p className="mt-4 max-w-2xl text-brand-slate">
            We triage every report within minutes, route it to the right vendor, and send you a
            link to track progress. If this is an emergency (gas, flood, fire, no power), call us
            directly — see the welcome book for the after-hours number.
          </p>
          <div className="mt-10">
            <ReportForm defaultProperty={defaultProperty} reportedBy={reportedBy} />
          </div>
        </Container>
      </main>
      <Footer />
    </>
  );
}
