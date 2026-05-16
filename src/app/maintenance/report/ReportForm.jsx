'use client';

import { useState } from 'react';
import Link from 'next/link';
import { PROPERTIES } from '@/lib/constants';

export function ReportForm({ defaultProperty, reportedBy }) {
  const [propertySlug, setPropertySlug] = useState(defaultProperty);
  const [description, setDescription] = useState('');
  const [reporterName, setReporterName] = useState('');
  const [reporterEmail, setReporterEmail] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState(null);

  async function submit(e) {
    e.preventDefault();
    setError(''); setBusy(true); setResult(null);
    try {
      const r = await fetch('/api/maintenance/intake', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          propertySlug, description, reportedBy, reporterName, reporterEmail,
        }),
      });
      const json = await r.json();
      if (!r.ok) throw new Error(json.error || 'Request failed');
      setResult(json);
    } catch (err) {
      setError(err.message || 'Something went wrong.');
    } finally {
      setBusy(false);
    }
  }

  if (result) {
    return (
      <div className="rounded-xl border border-brand-slate/15 bg-white p-8 shadow-sm">
        <p className="text-xs uppercase tracking-[0.32em] text-brand-jade">Triaged</p>
        <h2 className="mt-2 text-2xl font-semibold text-brand-ink">
          {result.triage.title}
        </h2>
        <div className="mt-4 grid grid-cols-2 gap-3 text-sm text-brand-slate">
          <div>
            <div className="text-xs uppercase tracking-widest text-brand-ink/70 font-medium">Category</div>
            <div className="text-brand-ink font-medium">{result.triage.category}</div>
          </div>
          <div>
            <div className="text-xs uppercase tracking-widest text-brand-ink/70 font-medium">Severity</div>
            <div className="text-brand-ink font-medium">{result.triage.severity} / 5 — {result.triage.priority}</div>
          </div>
          <div>
            <div className="text-xs uppercase tracking-widest text-brand-ink/70 font-medium">Vendor</div>
            <div className="text-brand-ink font-medium">
              {result.triage.vendor?.name || <span className="opacity-60">Pending owner match</span>}
            </div>
          </div>
          <div>
            <div className="text-xs uppercase tracking-widest text-brand-ink/70 font-medium">ClickUp</div>
            <div className="text-brand-ink font-medium">
              {result.clickup.url
                ? <a href={result.clickup.url} target="_blank" rel="noopener noreferrer" className="underline">Open task ↗</a>
                : <span className="opacity-60">{result.clickup.stub ? 'Stub (no ClickUp key)' : 'Created'}</span>}
            </div>
          </div>
          <div>
            <div className="text-xs uppercase tracking-widest text-brand-ink/70 font-medium">Email (Vendor)</div>
            <div className="text-brand-ink font-medium">
              {result.email?.id && !result.email?.stub
                ? <span>Sent ✓</span>
                : <span className="opacity-60">{result.email?.stub ? 'Stub' : 'No vendor email'}</span>}
            </div>
          </div>
          <div>
            <div className="text-xs uppercase tracking-widest text-brand-ink/70 font-medium">SMS (Vendor)</div>
            <div className="text-brand-ink font-medium">
              {result.sms?.sid && !result.sms?.stub
                ? <span>Sent ✓</span>
                : <span className="opacity-60">{result.sms?.stub ? 'Pending 10DLC' : 'No vendor phone'}</span>}
            </div>
          </div>
        </div>
        {result.triage.recurringFlag && (
          <div className="mt-4 rounded-md bg-brand-gold/15 px-4 py-3 text-sm text-brand-ink">
            ⚠️ This category has had repeat tickets recently — flagged for capex review.
          </div>
        )}
        {result.triage.reasoning && (
          <p className="mt-4 text-sm italic text-brand-slate/80">{result.triage.reasoning}</p>
        )}
        <div className="mt-6 flex gap-3">
          {result.statusUrl && (
            <Link href={result.statusUrl} className="rounded-full bg-brand-ink px-5 py-2.5 text-sm text-brand-cloud">
              Track status
            </Link>
          )}
          <button
            onClick={() => { setResult(null); setDescription(''); }}
            className="rounded-full border border-brand-ink/20 px-5 py-2.5 text-sm">
            Report another issue
          </button>
        </div>
        <p className="mt-6 text-xs text-brand-slate">
          Stub flags: triage={String(result.triage.stub)} · clickup={String(result.clickup.stub)} · email={String(result.email?.stub ?? true)} · sms={String(result.sms.stub)}.
        </p>
        {(result.sms?.note || result.clickup?.note || result.email?.note) && (
          <div className="mt-3 rounded-md border border-amber-300/60 bg-amber-50 px-4 py-3 text-xs text-amber-900">
            <div className="font-semibold uppercase tracking-widest">Integration notes</div>
            {result.clickup?.note && (
              <div className="mt-1"><span className="font-medium">ClickUp:</span> {result.clickup.note}</div>
            )}
            {result.email?.note && (
              <div className="mt-1"><span className="font-medium">Email:</span> {result.email.note}</div>
            )}
            {result.email?.to && (
              <div className="mt-1"><span className="font-medium">Email to:</span> {result.email.to}</div>
            )}
            {result.sms?.note && (
              <div className="mt-1"><span className="font-medium">SMS:</span> {result.sms.note}</div>
            )}
            {result.sms?.to && (
              <div className="mt-1"><span className="font-medium">SMS to:</span> {result.sms.to}</div>
            )}
          </div>
        )}
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="grid gap-5 rounded-xl border border-brand-slate/15 bg-white p-8 shadow-sm">
      <label className="block">
        <span className="text-xs uppercase tracking-widest text-brand-ink/80 font-medium">Property</span>
        <select
          value={propertySlug}
          onChange={(e) => setPropertySlug(e.target.value)}
          className="mt-1 w-full rounded-md border border-brand-slate/20 bg-white px-3 py-2.5 text-sm text-brand-ink placeholder:text-brand-slate/55">
          {PROPERTIES.map((p) => (
            <option key={p.slug} value={p.slug}>{p.name} — {p.city}</option>
          ))}
        </select>
      </label>

      <label className="block">
        <span className="text-xs uppercase tracking-widest text-brand-ink/80 font-medium">What's going on?</span>
        <textarea
          required
          minLength={6}
          rows={6}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="e.g., The upstairs AC isn't cooling — air coming from the vents is room-temperature. Started this afternoon."
          className="mt-1 w-full rounded-md border border-brand-slate/20 bg-white px-3 py-2.5 text-sm leading-relaxed text-brand-ink placeholder:text-brand-slate/55" />
        <span className="mt-1 block text-xs text-brand-slate">
          Plain English is fine. Include when it started and which room.
        </span>
      </label>

      <div className="grid gap-5 sm:grid-cols-2">
        <label className="block">
          <span className="text-xs uppercase tracking-widest text-brand-ink/80 font-medium">Your name</span>
          <input
            value={reporterName}
            onChange={(e) => setReporterName(e.target.value)}
            placeholder="Optional"
            className="mt-1 w-full rounded-md border border-brand-slate/20 bg-white px-3 py-2.5 text-sm text-brand-ink placeholder:text-brand-slate/55" />
        </label>
        <label className="block">
          <span className="text-xs uppercase tracking-widest text-brand-ink/80 font-medium">Email for updates</span>
          <input
            type="email"
            value={reporterEmail}
            onChange={(e) => setReporterEmail(e.target.value)}
            placeholder="Optional"
            className="mt-1 w-full rounded-md border border-brand-slate/20 bg-white px-3 py-2.5 text-sm text-brand-ink placeholder:text-brand-slate/55" />
        </label>
      </div>

      {error && <div className="rounded-md bg-rose-50 px-4 py-3 text-sm text-rose-800">{error}</div>}

      <p className="text-xs text-brand-slate/80 leading-relaxed">
        By submitting this report, you authorize Granderson Destinations to share the
        details with a matched maintenance vendor and to send you transactional email
        status updates about the repair. Vendors receive SMS dispatch under a separate
        signed agreement; message and data rates may apply to them. We do not send
        marketing messages. Reply <strong>STOP</strong> to any SMS to opt out, reply{' '}
        <strong>HELP</strong> for assistance. See our{' '}
        <Link href="/legal/terms" className="underline">Terms</Link>{' '}and{' '}
        <Link href="/legal/privacy" className="underline">Privacy Policy</Link>.
      </p>

      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={busy || description.length < 6}
          className="rounded-full bg-brand-ink px-6 py-3 text-sm text-brand-cloud disabled:opacity-50">
          {busy ? 'Triaging…' : 'Submit report'}
        </button>
        <p className="text-xs text-brand-slate">
          Reporting as <span className="font-medium text-brand-ink">{reportedBy}</span>.
        </p>
      </div>
    </form>
  );
}
