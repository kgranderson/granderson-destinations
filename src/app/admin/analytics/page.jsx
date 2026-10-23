import { notFound } from 'next/navigation';
import { requireOwner } from '@/lib/admin/require-owner';
import { loadAnalysis } from '@/lib/analytics/service';
import { AdminShell } from '@/components/admin/AdminShell';
import { PerformanceView } from '@/components/admin/PerformanceView';
export const dynamic='force-dynamic';
export const metadata={title:'Property analytics · Admin',robots:{index:false,follow:false}};
export default async function AnalyticsPage({searchParams}){
  const auth=await requireOwner('/admin/analytics');const sp=await searchParams;const months=[3,6,12].includes(Number(sp.months))?Number(sp.months):12;
  const data=await loadAnalysis(sp.property||'palm-springs',months);if(!data)notFound();
  return <AdminShell profile={auth.profile} eyebrow="Portfolio intelligence" title="Performance, in context." description="Compare actual lodging revenue, occupancy and nightly rates with similar rentals. Every comparison uses the same months and currency."><PerformanceView data={data} mode="analytics" months={months} airdnaConfigured={!!process.env.AIRDNA_API_KEY}/></AdminShell>;
}
