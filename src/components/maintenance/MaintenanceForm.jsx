'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, RefreshCw, AlertCircle, CheckCircle2 } from 'lucide-react';
import { PROPERTIES } from '@/lib/constants';

const CATEGORIES = ['plumbing', 'electrical', 'hvac', 'pool', 'landscape', 'appliance', 'general'];
const PRIORITIES = ['low', 'normal', 'high', 'urgent'];

export function MaintenanceForm() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [status, setStatus] = useState({ kind: 'idle' });
  const [form, setForm] = useState({
    propertySlug: PROPERTIES[0].slug,
    title: '',
    description: '',
    priority: 'normal',
    category: 'general',
    vendor_assigned: '',
    estimated_cost: '',
    scheduled_for: '',
  });

  function update(k, v) {
    setForm((f) => ({ ...f, [k]: v }));
  }

  async function submit(e) {
    e.preventDefault();
    setSubmitting(true);
    setStatus({ kind: 'idle' });
    const payload = {
      ...form,
      estimated_cost: form.estimated_cost ? Number(form.estimated_cost) : null,
      scheduled_for: form.scheduled_for || null,
    };
    const res = await fetch('/api/maintenance', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const data = await res.json().catch(() => ({}));
    setSubmitting(false);
    if (!res.ok) {
      setStatus({ kind: 'error', message: data.error || `Failed (${res.status})` });
      return;
    }
    setStatus({ kind: 'success' });
    setForm({
      propertySlug: PROPERTIES[0].slug,
      title: '',
      description: '',
      priority: 'normal',
      category: 'general',
      vendor_assigned: '',
      estimated_cost: '',
      scheduled_for: '',
    });
    router.refresh();
    setTimeout(() => {
      setOpen(false);
      setStatus({ kind: 'idle' });
    }, 1200);
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-2 rounded-full bg-brand-ink px-5 py-2.5 text-sm font-medium text-brand-cloud hover:bg-brand-slate"
      >
        <Plus size={14} /> New maintenance request
      </button>
    );
  }

  return (
    <form
      onSubmit={submit}
      className="rounded-2xl border border-brand-tan/60 bg-brand-cloud p-5 shadow-soft"
    >
      <div className="flex items-baseline justify-between">
        <h3 className="display text-xl text-brand-ink">New maintenance request</h3>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="text-xs text-brand-slate underline-offset-4 hover:underline"
        >
          Cancel
        </button>
      </div>

      <div className="mt-5 grid gap-4 md:grid-cols-2">
        <Field label="Property">
          <select
            value={form.propertySlug}
            onChange={(e) => update('propertySlug', e.target.value)}
            className="w-full bg-transparent text-sm outline-none"
          >
            {PROPERTIES.map((p) => (
              <option key={p.slug} value={p.slug}>
                {p.name} · {p.shortName}
              </option>
            ))}
          </select>
        </Field>

        <Field label="Priority">
          <select
            value={form.priority}
            onChange={(e) => update('priority', e.target.value)}
            className="w-full bg-transparent text-sm outline-none capitalize"
          >
            {PRIORITIES.map((p) => (
              <option key={p}>{p}</option>
            ))}
          </select>
        </Field>

        <Field label="Title" className="md:col-span-2">
          <input
            required
            value={form.title}
            onChange={(e) => update('title', e.target.value)}
            placeholder="e.g. Pool pump making grinding noise"
            className="w-full bg-transparent text-sm outline-none"
          />
        </Field>

        <Field label="Description" className="md:col-span-2">
          <textarea
            value={form.description}
            onChange={(e) => update('description', e.target.value)}
            rows={3}
            placeholder="What's happening, when did it start, anything else useful…"
            className="w-full resize-none bg-transparent text-sm outline-none"
          />
        </Field>

        <Field label="Category">
          <select
            value={form.category}
            onChange={(e) => update('category', e.target.value)}
            className="w-full bg-transparent text-sm outline-none capitalize"
          >
            {CATEGORIES.map((c) => (
              <option key={c}>{c}</option>
            ))}
          </select>
        </Field>

        <Field label="Vendor (optional)">
          <input
            value={form.vendor_assigned}
            onChange={(e) => update('vendor_assigned', e.target.value)}
            placeholder="e.g. Desert Pool Services"
            className="w-full bg-transparent text-sm outline-none"
          />
        </Field>

        <Field label="Estimated cost (USD)">
          <input
            type="number"
            value={form.estimated_cost}
            onChange={(e) => update('estimated_cost', e.target.value)}
            placeholder="0"
            className="w-full bg-transparent text-sm outline-none"
          />
        </Field>

        <Field label="Scheduled for">
          <input
            type="date"
            value={form.scheduled_for}
            onChange={(e) => update('scheduled_for', e.target.value)}
            className="w-full bg-transparent text-sm outline-none"
          />
        </Field>
      </div>

      <div className="mt-5 flex items-center gap-3">
        <button
          type="submit"
          disabled={submitting}
          className="inline-flex items-center gap-2 rounded-full bg-brand-ink px-5 py-2.5 text-sm font-medium text-brand-cloud hover:bg-brand-slate disabled:opacity-50"
        >
          {submitting ? <RefreshCw size={14} className="animate-spin" /> : <Plus size={14} />}
          {submitting ? 'Saving…' : 'Create request'}
        </button>

        {status.kind === 'success' && (
          <span className="inline-flex items-center gap-1 text-sm text-brand-jade">
            <CheckCircle2 size={14} /> Created.
          </span>
        )}
        {status.kind === 'error' && (
          <span className="inline-flex items-center gap-1 text-sm text-brand-terracotta">
            <AlertCircle size={14} /> {status.message}
          </span>
        )}
      </div>
    </form>
  );
}

function Field({ label, children, className = '' }) {
  return (
    <label className={`block rounded-xl border border-brand-tan/60 bg-brand-sand/30 px-3 py-2 ${className}`}>
      <span className="block text-[10px] uppercase tracking-widest text-brand-slate/70">{label}</span>
      <span className="mt-1 block">{children}</span>
    </label>
  );
}
