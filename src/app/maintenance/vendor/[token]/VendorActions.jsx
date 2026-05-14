'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { STATUS_LABELS } from '@/lib/maintenance/status';

export function VendorActions({
  token,
  currentStatus,
  allowedNext,
  vendorNotes: initialNotes,
  costEstimateCents,
  costFinalCents,
  etaAt,
}) {
  const router = useRouter();
  const [notes, setNotes] = useState(initialNotes || '');
  const [estimate, setEstimate] = useState(costEstimateCents != null ? (costEstimateCents / 100).toFixed(2) : '');
  const [finalCost, setFinalCost] = useState(costFinalCents != null ? (costFinalCents / 100).toFixed(2) : '');
  const [eta, setEta] = useState(etaAt ? etaAt.slice(0, 16) : ''); // datetime-local format
  const [busy, setBusy] = useState(false);
  const [flash, setFlash] = useState('');
  const [error, setError] = useState('');

  async function post(body) {
    setError('');
    setFlash('');
    setBusy(true);
    try {
      const r = await fetch(`/api/maintenance/vendor/${token}/update`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const json = await r.json();
      if (!r.ok) throw new Error(json.error || 'Request failed');
      setFlash('Saved.');
      router.refresh(); // pull fresh server-side data
    } catch (err) {
      setError(err.message || 'Something went wrong.');
    } finally {
      setBusy(false);
    }
  }

  function updateStatus(next) {
    post({ status: next });
  }

  function saveDetails(e) {
    e.preventDefault();
    const body = {
      vendorNotes: notes,
      costEstimateCents: estimate ? Math.round(parseFloat(estimate) * 100) : null,
      costFinalCents: finalCost ? Math.round(parseFloat(finalCost) * 100) : null,
      etaAt: eta ? new Date(eta).toISOString() : null,
    };
    post(body);
  }

  return (
    <div className="grid gap-6">
      <div>
        <div className="text-xs uppercase tracking-widest text-brand-ink/70 font-medium mb-2">Update status</div>
        <div className="flex flex-wrap gap-2">
          {allowedNext.length === 0 && (
            <span className="text-sm text-brand-slate">No further transitions from <span className="font-medium">{STATUS_LABELS[currentStatus]}</span>. Contact owner to reopen.</span>
          )}
          {allowedNext.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => updateStatus(s)}
              disabled={busy}
              className="rounded-full bg-brand-ink px-4 py-2 text-xs text-brand-cloud disabled:opacity-50">
              Mark {STATUS_LABELS[s]}
            </button>
          ))}
        </div>
      </div>

      <form onSubmit={saveDetails} className="grid gap-4">
        <label className="block">
          <span className="text-xs uppercase tracking-widest text-brand-ink/70 font-medium">Vendor notes</span>
          <textarea
            rows={4}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="What you found, what you did, what you need from the owner."
            className="mt-1 w-full rounded-md border border-brand-slate/20 bg-white px-3 py-2.5 text-sm leading-relaxed" />
        </label>

        <div className="grid gap-4 sm:grid-cols-3">
          <label className="block">
            <span className="text-xs uppercase tracking-widest text-brand-ink/70 font-medium">Cost estimate ($)</span>
            <input
              type="number"
              step="0.01"
              min="0"
              value={estimate}
              onChange={(e) => setEstimate(e.target.value)}
              placeholder="0.00"
              className="mt-1 w-full rounded-md border border-brand-slate/20 bg-white px-3 py-2.5 text-sm" />
          </label>
          <label className="block">
            <span className="text-xs uppercase tracking-widest text-brand-ink/70 font-medium">Final cost ($)</span>
            <input
              type="number"
              step="0.01"
              min="0"
              value={finalCost}
              onChange={(e) => setFinalCost(e.target.value)}
              placeholder="0.00"
              className="mt-1 w-full rounded-md border border-brand-slate/20 bg-white px-3 py-2.5 text-sm" />
          </label>
          <label className="block">
            <span className="text-xs uppercase tracking-widest text-brand-ink/70 font-medium">ETA</span>
            <input
              type="datetime-local"
              value={eta}
              onChange={(e) => setEta(e.target.value)}
              className="mt-1 w-full rounded-md border border-brand-slate/20 bg-white px-3 py-2.5 text-sm" />
          </label>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="submit"
            disabled={busy}
            className="rounded-full border border-brand-ink/40 px-5 py-2.5 text-sm text-brand-ink disabled:opacity-50">
            {busy ? 'Saving…' : 'Save notes & costs'}
          </button>
          {flash && <span className="text-xs text-brand-jade">{flash}</span>}
          {error && <span className="text-xs text-rose-700">{error}</span>}
        </div>
      </form>
    </div>
  );
}
