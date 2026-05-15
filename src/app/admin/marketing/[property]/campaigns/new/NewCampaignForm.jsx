'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Calendar, Megaphone, Target, Hash, AlertTriangle, CheckCircle2 } from 'lucide-react';

const THEMES = [
  'lifestyle',
  'pool-or-courtyard',
  'kitchen',
  'golden-hour',
  'neighborhood',
  'detail',
  'event',
];

/**
 * New campaign wizard. Single-page form (not a multi-step wizard —
 * the inputs are simple enough). On submit, POST to /api/admin/
 * marketing/campaigns; on success, redirect to /approve where the
 * generated drafts will be sitting in the queue.
 */
export function NewCampaignForm({ propertySlug, anchorEvents }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);

  // Default window: today + 1 week → today + 5 weeks (4 weeks of posts)
  const today = new Date();
  const start = new Date(today.getTime() + 7 * 86_400_000);
  const end = new Date(today.getTime() + 35 * 86_400_000);

  const [form, setForm] = useState({
    name: '',
    objective: '',
    theme: 'lifestyle',
    anchorEventSlug: '',
    startDate: start.toISOString().slice(0, 10),
    endDate: end.toISOString().slice(0, 10),
    targetPostCount: 8,
    goalBookings: '',
    notes: '',
  });

  function applyEventPreset(slug) {
    if (!slug) {
      setForm((f) => ({ ...f, anchorEventSlug: '' }));
      return;
    }
    const ev = anchorEvents.find((e) => e.slug === slug);
    if (!ev) return;
    // Pre-fill: name from event, window ending the day before event starts,
    // theme='event', 8 posts (will be event-anchored at 21d/14d/7d/1d)
    const evStart = new Date(`${ev.startDate}T00:00:00Z`);
    const campaignStart = new Date(evStart.getTime() - 28 * 86_400_000);
    const campaignEnd = new Date(evStart.getTime() - 1 * 86_400_000);
    setForm((f) => ({
      ...f,
      name: f.name || `${ev.name} launch`,
      theme: 'event',
      anchorEventSlug: slug,
      startDate: campaignStart.toISOString().slice(0, 10),
      endDate: campaignEnd.toISOString().slice(0, 10),
      targetPostCount: 8,
    }));
  }

  async function submit(e) {
    e.preventDefault();
    setError(null);
    if (!form.name.trim()) {
      setError('Campaign name is required.');
      return;
    }
    setBusy(true);
    try {
      const r = await fetch('/api/admin/marketing/campaigns', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          propertySlug,
          name: form.name.trim(),
          objective: form.objective.trim() || null,
          theme: form.theme,
          anchorEventSlug: form.anchorEventSlug || null,
          startDate: form.startDate,
          endDate: form.endDate,
          targetPostCount: Number(form.targetPostCount) || 8,
          goalBookings: form.goalBookings ? Number(form.goalBookings) : null,
          notes: form.notes.trim() || null,
        }),
      });
      const json = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(json.error || `Create failed (${r.status})`);
      // On success: route to the approval queue so the operator can
      // review the drafts that were just generated.
      router.push(`/admin/marketing/${propertySlug}/approve?campaign=${json.campaign.id}`);
    } catch (err) {
      setError(err.message);
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} className="space-y-6 rounded-2xl border border-brand-tan/60 bg-brand-cloud p-6 shadow-soft">
      {/* Anchor event preset */}
      {anchorEvents.length > 0 && (
        <div>
          <label className="block">
            <span className="flex items-center gap-1.5 text-xs uppercase tracking-widest text-brand-ink/70 font-medium">
              <Target size={12} />
              Anchor to an upcoming event (optional)
            </span>
            <select
              value={form.anchorEventSlug}
              onChange={(e) => applyEventPreset(e.target.value)}
              className="mt-1 w-full rounded-md border border-brand-slate/20 bg-white px-3 py-2 text-sm"
            >
              <option value="">— None (free-form campaign) —</option>
              {anchorEvents.map((e) => (
                <option key={e.slug} value={e.slug}>
                  {e.name} ({e.startDate} → {e.endDate})
                </option>
              ))}
            </select>
            <p className="mt-1 text-[11px] text-brand-slate/70">
              Picking an event pre-fills the campaign window and forces lead-up posts at 21/14/7/1
              days before the event. You can still tweak any field below.
            </p>
          </label>
        </div>
      )}

      <div>
        <label className="block">
          <span className="flex items-center gap-1.5 text-xs uppercase tracking-widest text-brand-ink/70 font-medium">
            <Megaphone size={12} />
            Campaign name *
          </span>
          <input
            type="text"
            required
            value={form.name}
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            placeholder="Coachella 2027 launch"
            className="mt-1 w-full rounded-md border border-brand-slate/20 bg-white px-3 py-2 text-sm"
          />
        </label>
      </div>

      <div>
        <label className="block">
          <span className="text-xs uppercase tracking-widest text-brand-ink/70 font-medium">
            Strategic objective (optional)
          </span>
          <input
            type="text"
            value={form.objective}
            onChange={(e) => setForm((f) => ({ ...f, objective: e.target.value }))}
            placeholder="Drive 4-night bookings for Coachella W1"
            className="mt-1 w-full rounded-md border border-brand-slate/20 bg-white px-3 py-2 text-sm"
          />
        </label>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block">
          <span className="flex items-center gap-1.5 text-xs uppercase tracking-widest text-brand-ink/70 font-medium">
            <Calendar size={12} />
            Start date *
          </span>
          <input
            type="date"
            required
            value={form.startDate}
            onChange={(e) => setForm((f) => ({ ...f, startDate: e.target.value }))}
            className="mt-1 w-full rounded-md border border-brand-slate/20 bg-white px-3 py-2 text-sm"
          />
        </label>
        <label className="block">
          <span className="flex items-center gap-1.5 text-xs uppercase tracking-widest text-brand-ink/70 font-medium">
            <Calendar size={12} />
            End date *
          </span>
          <input
            type="date"
            required
            value={form.endDate}
            onChange={(e) => setForm((f) => ({ ...f, endDate: e.target.value }))}
            className="mt-1 w-full rounded-md border border-brand-slate/20 bg-white px-3 py-2 text-sm"
          />
        </label>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block">
          <span className="text-xs uppercase tracking-widest text-brand-ink/70 font-medium">
            Theme
          </span>
          <select
            value={form.theme}
            onChange={(e) => setForm((f) => ({ ...f, theme: e.target.value }))}
            className="mt-1 w-full rounded-md border border-brand-slate/20 bg-white px-3 py-2 text-sm"
          >
            {THEMES.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </label>
        <label className="block">
          <span className="flex items-center gap-1.5 text-xs uppercase tracking-widest text-brand-ink/70 font-medium">
            <Hash size={12} />
            Target post count
          </span>
          <input
            type="number"
            min={1}
            max={50}
            value={form.targetPostCount}
            onChange={(e) => setForm((f) => ({ ...f, targetPostCount: e.target.value }))}
            className="mt-1 w-full rounded-md border border-brand-slate/20 bg-white px-3 py-2 text-sm"
          />
          <p className="mt-1 text-[11px] text-brand-slate/70">
            Posts are spaced Tue/Thu/Sat at 6pm. Cap is 50.
          </p>
        </label>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block">
          <span className="text-xs uppercase tracking-widest text-brand-ink/70 font-medium">
            Goal bookings (optional)
          </span>
          <input
            type="number"
            min={0}
            value={form.goalBookings}
            onChange={(e) => setForm((f) => ({ ...f, goalBookings: e.target.value }))}
            placeholder="6"
            className="mt-1 w-full rounded-md border border-brand-slate/20 bg-white px-3 py-2 text-sm"
          />
        </label>
        <div />
      </div>

      <label className="block">
        <span className="text-xs uppercase tracking-widest text-brand-ink/70 font-medium">
          Notes (optional)
        </span>
        <textarea
          rows={2}
          value={form.notes}
          onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
          placeholder="Voice notes, brand reminders, refs to look at later…"
          className="mt-1 w-full rounded-md border border-brand-slate/20 bg-white px-3 py-2 text-sm"
        />
      </label>

      {error && (
        <div className="flex items-start gap-2 rounded-md bg-rose-50 p-3 text-sm text-rose-800">
          <AlertTriangle size={16} /> {error}
        </div>
      )}

      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={busy}
          className="inline-flex items-center gap-1.5 rounded-full bg-brand-ink px-5 py-2 text-sm text-brand-cloud hover:bg-brand-ink/85 disabled:opacity-50"
        >
          <CheckCircle2 size={14} />
          {busy ? 'Generating drafts…' : 'Create campaign + generate drafts'}
        </button>
        <p className="text-xs text-brand-slate/70">
          You&rsquo;ll land on the Approve queue with the new drafts ready to review.
        </p>
      </div>
    </form>
  );
}
