import { requireOwner } from '@/lib/admin/require-owner';
import { latestRuns, audit } from '@/lib/reliability/service';
import { CHECKS, productionEnabled } from '@/lib/reliability/core.mjs';
import { AdminShell } from '@/components/admin/AdminShell';
import { RunKeyCheck } from '@/components/admin/RunKeyCheck';
export const dynamic='force-dynamic';
export const metadata={title:'API health · Admin',robots:{index:false,follow:false}};
export default async function KeysPage(){
  const auth=await requireOwner('/admin/keys'); const {runs,code}=await latestRuns(); await audit('key_check_view',auth); const run=runs[0];
  const results=run?.results||CHECKS.map(c=>({...c,outcome:'not_checked',detail:'No completed run'}));
  const stale=run&&Date.now()-Date.parse(run.started_at)>36*3600000;
  return <AdminShell profile={auth.profile} eyebrow="Reliability" title="Know what is connected." description="Credential checks run inside this app. Your registry receives results and version tags; keys stay on the server.">
    <div className="rounded-2xl bg-brand-ink p-7 text-white"><div className="flex flex-wrap items-start justify-between gap-6"><div><p className="text-xs uppercase tracking-widest text-white/60">Latest check</p><h2 className="mt-2 text-2xl">{!run?'Awaiting first run':stale?'Check overdue':run.healthy?'No failing checks':'Services need attention'}</h2><p className="mt-2 text-sm text-white/70">{run?new Date(run.started_at).toLocaleString('en-US',{timeZone:'America/Los_Angeles'})+' Pacific':'Activate production checks after setup.'}</p></div><p className="text-sm">{run?.deployment_id?.slice(0,20)||'No deployment checked'}</p></div></div>
    <div className="my-6 flex flex-wrap items-center justify-between gap-4"><p className="max-w-2xl text-sm text-brand-slate">Presence-only and skipped checks do not prove a key works. Paid services are never called by this checker.</p><RunKeyCheck enabled={productionEnabled(process.env)&&!code}/></div>
    {code&&<p className="mb-5 rounded-xl bg-brand-tan p-4">Check history is unavailable. Verify the database connection and apply the reliability migration.</p>}
    {(!process.env.RESEND_API_KEY||!process.env.KEY_CHECK_EMAIL_FROM)&&<p className="mb-5 rounded-xl bg-brand-sand p-4 text-sm">Email alerts are not configured. Add the alert sender and Resend credential to enable change notifications and Monday summaries.</p>}
    <div className="overflow-x-auto rounded-2xl border border-brand-tan"><table className="w-full text-left text-sm"><thead className="bg-brand-sand"><tr>{['Service','Result','Detail','Key version'].map(h=><th key={h} className="p-4 font-medium">{h}</th>)}</tr></thead><tbody>{results.map(r=><tr key={r.id} className="border-t border-brand-tan/60"><td className="p-4"><strong className="font-medium">{r.label}</strong><div className="mt-1 text-xs text-brand-slate">{r.variable}</div></td><td className="p-4"><span className={`rounded-full px-3 py-1 ${r.outcome==='pass'?'bg-brand-jade/15 text-brand-jade':['missing','invalid_auth','provider_unavailable','permission_or_resource','quota_rate'].includes(r.outcome)?'bg-brand-terracotta/15 text-brand-terracotta':'bg-brand-sand text-brand-slate'}`}>{r.outcome.replaceAll('_',' ')}</span></td><td className="p-4 text-brand-slate">{r.detail?.replaceAll('_',' ')}</td><td className="p-4 font-mono text-xs">{r.version_tag||'—'}</td></tr>)}</tbody></table></div>
    <section className="mt-8"><h2 className="display text-2xl">Recent checks</h2><ul className="mt-4 space-y-2 text-sm">{runs.slice(0,30).map(r=><li key={r.id} className="flex justify-between border-b border-brand-tan py-3"><span>{r.started_at}</span><span>{r.healthy?'Healthy':'Needs attention'} · {r.results.length} checks</span></li>)}</ul></section>
  </AdminShell>;
}
