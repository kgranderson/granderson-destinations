import Link from 'next/link';
import { ArrowUpRight } from 'lucide-react';
import { NavBar } from '@/components/shared/NavBar';
import { Footer } from '@/components/shared/Footer';
import { AdminNav } from '@/components/shared/AdminNav';
import { assertAdmin } from '@/components/shared/AdminGuard';
import { PROPERTIES } from '@/lib/constants';
import { loadOccupancy } from '@/lib/hospitable/loader';
import { pct, usd } from '@/lib/utils/format';

export const metadata = { title: 'Admin · Occupancy', robots: { index: false, follow: false } };
export const revalidate = 600;

export default async function OccupancyIndex() {
  const auth = await assertAdmin();
  if (!auth.ok) return auth.render;

  const blocks = await Promise.all(
    PROPERTIES.map(async (p) => {
      const { rows, stub } = await loadOccupancy(p.slug);
      const ttm = rows.slice(-12);
      const booked = ttm.reduce((s, r) => s + (r.nights_booked || 0), 0);
      const available = ttm.reduce((s, r) => s + (r.nights_available || 0), 0);
      const adr =
        ttm.length > 0 ? ttm.reduce((s, r) => s + (r.adr_realized || 0), 0) / ttm.length : 0;
      const occ = available > 0 ? booked / available : 0;
      return {
        property: p,
        ttmOcc: occ,
        ttmAdr: adr,
        ttmRevPar: adr * occ,
        nightsBooked: booked,
        stub,
      };
    }),
  );

  return (
    <>
      <NavBar />
      <main className="animate-page-in bg-brand-cloud pt-24 lg:pt-28">
        <div className="mx-auto flex max-w-[88rem]">
          <AdminNav profile={auth.profile} />
          <div className="min-w-0 flex-1 px-5 py-10 sm:px-8 lg:px-10">
            <p className="text-xs uppercase tracking-[0.32em] text-brand-slate/70">
              Admin · Occupancy
            </p>
            <h1 className="display mt-3 text-display-lg text-brand-ink">Occupancy analysis</h1>
            <p className="mt-2 max-w-2xl text-sm text-brand-slate">
              Nights booked, realized ADR, and RevPAR by month for every property. Pulls from
              Supabase&rsquo;s <code className="rounded bg-brand-tan/40 px-1">occupancy_records</code> when
              populated; falls back to synthetic data otherwise.
            </p>

            <div className="mt-10 grid gap-6 md:grid-cols-2">
              {blocks.map((b) => (
                <Link
                  key={b.property.slug}
                  href={`/admin/occupancy/${b.property.slug}`}
                  className="group block rounded-2xl border border-brand-tan/60 bg-brand-cloud p-6 shadow-soft transition-shadow hover:shadow-lift"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-[10px] uppercase tracking-widest text-brand-slate/70">
                        {b.property.city} · {b.property.country}
                      </p>
                      <h2 className="display mt-1 text-2xl text-brand-ink">{b.property.name}</h2>
                      {b.stub && (
                        <span className="mt-2 inline-block rounded-full bg-brand-tan/60 px-2 py-0.5 text-[10px] uppercase tracking-widest text-brand-slate">
                          Synthetic
                        </span>
                      )}
                    </div>
                    <ArrowUpRight className="text-brand-gold transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
                  </div>

                  <dl className="mt-5 grid grid-cols-3 gap-3">
                    <Mini label="Occupancy" value={pct(b.ttmOcc, { fractionDigits: 1 })} />
                    <Mini label="Realized ADR" value={usd(b.ttmAdr, { fractionDigits: 0 })} />
                    <Mini label="RevPAR" value={usd(b.ttmRevPar, { fractionDigits: 0 })} />
                  </dl>
                  <p className="mt-3 text-xs text-brand-slate">
                    {b.nightsBooked.toLocaleString()} nights booked (trailing 12 months)
                  </p>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}

function Mini({ label, value }) {
  return (
    <div className="rounded-xl bg-brand-sand/40 px-3 py-2">
      <p className="text-[10px] uppercase tracking-widest text-brand-slate/70">{label}</p>
      <p className="display mt-0.5 text-base text-brand-ink">{value}</p>
    </div>
  );
}
