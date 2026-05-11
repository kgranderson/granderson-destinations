import { NavBar } from '@/components/shared/NavBar';
import { Footer } from '@/components/shared/Footer';
import { AdminNav } from '@/components/shared/AdminNav';
import { assertAdmin } from '@/components/shared/AdminGuard';
import { MaintenanceForm } from '@/components/maintenance/MaintenanceForm';
import { MaintenanceList } from '@/components/maintenance/MaintenanceList';
import { listMaintenance, countByStatus } from '@/lib/maintenance/loader';

export const metadata = { title: 'Admin · Maintenance', robots: { index: false, follow: false } };
export const revalidate = 60;

export default async function MaintenancePage() {
  const auth = await assertAdmin();
  if (!auth.ok) return auth.render;

  const [{ items }, counts] = await Promise.all([listMaintenance(), countByStatus()]);

  return (
    <>
      <NavBar />
      <main className="animate-page-in bg-brand-cloud pt-24 lg:pt-28">
        <div className="mx-auto flex max-w-[88rem]">
          <AdminNav profile={auth.profile} />
          <div className="min-w-0 flex-1 px-5 py-10 sm:px-8 lg:px-10">
            <p className="text-xs uppercase tracking-[0.32em] text-brand-slate/70">
              Admin · Maintenance
            </p>
            <h1 className="display mt-3 text-display-lg text-brand-ink">Maintenance requests</h1>
            <p className="mt-2 max-w-2xl text-sm text-brand-slate">
              Submit, track, and resolve maintenance across every property. Stored in Supabase;
              ClickUp two-way sync ships in a follow-up milestone.
            </p>

            {/* KPIs */}
            <div className="mt-8 grid gap-4 sm:grid-cols-4">
              <Stat label="Open" value={counts.open || 0} tone="terracotta" />
              <Stat label="In progress" value={counts.in_progress || 0} tone="gold" />
              <Stat label="Scheduled" value={counts.scheduled || 0} tone="slate" />
              <Stat label="Completed" value={counts.completed || 0} tone="jade" />
            </div>

            {/* New request form */}
            <div className="mt-8">
              <MaintenanceForm />
            </div>

            {/* List */}
            <div className="mt-8">
              <MaintenanceList items={items} />
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}

function Stat({ label, value, tone }) {
  const tones = {
    terracotta: 'text-brand-terracotta',
    gold: 'text-brand-gold',
    slate: 'text-brand-slate',
    jade: 'text-brand-jade',
  };
  return (
    <div className="rounded-2xl border border-brand-tan/60 bg-brand-cloud p-4 shadow-soft">
      <p className="text-xs uppercase tracking-[0.22em] text-brand-slate/70">{label}</p>
      <p className={`display mt-1 text-3xl ${tones[tone]}`}>{value}</p>
    </div>
  );
}
