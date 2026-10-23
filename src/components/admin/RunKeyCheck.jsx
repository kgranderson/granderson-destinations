'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
export function RunKeyCheck({ enabled }) {
  const [busy,setBusy]=useState(false),[message,setMessage]=useState(''); const router=useRouter();
  async function run(){ setBusy(true); setMessage(''); try { const res=await fetch('/api/admin/keys/run',{method:'POST'}); const data=await res.json(); setMessage(data.run?'Check complete.':({cooldown:'Wait 10 minutes between checks.',disabled:'Production checks are not activated.',storage_unavailable:'Apply the database migration before running checks.'}[data.code]||'The check could not finish.')); router.refresh(); } catch { setMessage('Connection failed. Try again.'); } finally {setBusy(false);} }
  return <div><button onClick={run} disabled={busy||!enabled} className="rounded-full bg-brand-ink px-6 py-3 text-sm text-white disabled:opacity-50">{busy?'Checking services…':'Run checks now'}</button><p role="status" className="mt-2 text-sm text-brand-slate">{message}</p></div>;
}
