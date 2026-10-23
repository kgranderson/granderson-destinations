import { notFound } from 'next/navigation';
import { requireOwner } from '@/lib/admin/require-owner';
import { loadAnalysis } from '@/lib/analytics/service';
import { AdminShell } from '@/components/admin/AdminShell';
import { PerformanceView } from '@/components/admin/PerformanceView';
export const dynamic='force-dynamic';
export const metadata={title:'Property thinking · Admin',robots:{index:false,follow:false}};
export default async function OptimizePage({searchParams}){
  const auth=await requireOwner('/admin/optimize');const sp=await searchParams;const data=await loadAnalysis(sp.property||'palm-springs');if(!data)notFound();
  return <AdminShell profile={auth.profile} eyebrow="Property thinking" title="A better next decision." description="An evidence-based operating review that identifies opportunities, explains tradeoffs and helps you track each experiment."><PerformanceView data={data} mode="optimize"/></AdminShell>;
}
