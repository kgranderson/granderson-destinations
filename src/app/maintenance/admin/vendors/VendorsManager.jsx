'use client';

import { useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';

/**
 * Single-page vendor management UI: roster table at top, add-vendor form
 * inline, CSV/XLSX uploader with summary feedback at the bottom.
 *
 * All mutations go through the /api/maintenance/admin/vendors* endpoints
 * which are owner-gated by the gd_owner cookie set by the admin auth flow.
 * The page server-renders the initial roster; subsequent mutations call
 * router.refresh() so we always reflect server truth.
 */

const PHONE_HINT = 'E.164 format, e.g. +17605551234';

function emptyForm() {
  return {
    name: '',
    phone: '',
    email: '',
    specialties: [],
    markets: [],
    notes: '',
    active: true,
  };
}

function fmtPhone(raw) {
  if (!raw) return '—';
  const m = raw.match(/^\+1(\d{3})(\d{3})(\d{4})$/);
  if (m) return `(${m[1]}) ${m[2]}-${m[3]}`;
  return raw;
}

export function VendorsManager({ initialVendors, categories, properties }) {
  const router = useRouter();
  const [vendors, setVendors] = useState(initialVendors);
  const [filter, setFilter] = useState('');
  const [showInactive, setShowInactive] = useState(false);
  const [form, setForm] = useState(emptyForm());
  const [busy, setBusy] = useState(false);
  const [flash, setFlash] = useState('');
  const [error, setError] = useState('');
  const [uploadSummary, setUploadSummary] = useState(null);
  const fileInputRef = useRef(null);

  const filtered = useMemo(() => {
    const q = filter.trim().toLowerCase();
    return vendors.filter((v) => {
      if (!showInactive && !v.active) return false;
      if (!q) return true;
      return [v.name, v.email, v.phone, ...(v.specialties || []), ...(v.markets || [])]
        .filter(Boolean)
        .some((field) => String(field).toLowerCase().includes(q));
    });
  }, [vendors, filter, showInactive]);

  function toggleArrayField(field, value) {
    setForm((prev) => {
      const current = new Set(prev[field]);
      if (current.has(value)) current.delete(value);
      else current.add(value);
      return { ...prev, [field]: Array.from(current) };
    });
  }

  async function submitForm(e) {
    e.preventDefault();
    setError('');
    setFlash('');
    if (!form.name.trim()) {
      setError('Name is required.');
      return;
    }
    setBusy(true);
    try {
      const r = await fetch('/api/maintenance/admin/vendors', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          phone: form.phone.trim() || null,
          email: form.email.trim() || null,
          notes: form.notes.trim() || null,
        }),
      });
      const json = await r.json();
      if (!r.ok) throw new Error(json.error || 'Add failed');
      setVendors((prev) => [json.vendor, ...prev]);
      setForm(emptyForm());
      setFlash(`Added ${json.vendor.name}.`);
      router.refresh();
    } catch (err) {
      setError(err.message || 'Something went wrong.');
    } finally {
      setBusy(false);
    }
  }

  async function toggleActive(vendor) {
    setError('');
    try {
      const r = await fetch(`/api/maintenance/admin/vendors/${vendor.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ active: !vendor.active }),
      });
      const json = await r.json();
      if (!r.ok) throw new Error(json.error || 'Update failed');
      setVendors((prev) => prev.map((v) => (v.id === vendor.id ? json.vendor : v)));
      router.refresh();
    } catch (err) {
      setError(err.message || 'Toggle failed');
    }
  }

  async function deleteVendor(vendor) {
    if (!window.confirm(`Soft-delete ${vendor.name}? (Sets active=false; old tickets still resolve.)`)) return;
    setError('');
    try {
      const r = await fetch(`/api/maintenance/admin/vendors/${vendor.id}`, { method: 'DELETE' });
      if (!r.ok) throw new Error('Delete failed');
      setVendors((prev) => prev.map((v) => (v.id === vendor.id ? { ...v, active: false } : v)));
      setFlash(`${vendor.name} deactivated.`);
      router.refresh();
    } catch (err) {
      setError(err.message || 'Delete failed');
    }
  }

  async function handleUpload(e) {
    e.preventDefault();
    const file = fileInputRef.current?.files?.[0];
    if (!file) {
      setError('Choose a CSV or XLSX file first.');
      return;
    }
    setError('');
    setFlash('');
    setUploadSummary(null);
    setBusy(true);
    try {
      const fd = new FormData();
      fd.append('file', file);
      const r = await fetch('/api/maintenance/admin/vendors/bulk', { method: 'POST', body: fd });
      const json = await r.json();
      if (!r.ok && r.status !== 400) throw new Error(json.error || 'Upload failed');
      setUploadSummary(json);
      // Re-fetch list
      const listRes = await fetch('/api/maintenance/admin/vendors');
      const listJson = await listRes.json();
      if (listRes.ok) setVendors(listJson.vendors || []);
      if (fileInputRef.current) fileInputRef.current.value = '';
      router.refresh();
    } catch (err) {
      setError(err.message || 'Upload failed');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mt-8 space-y-12">
      {/* Roster */}
      <section>
        <div className="flex flex-wrap items-end gap-4">
          <div className="flex-1 min-w-[200px]">
            <label className="block">
              <span className="text-xs uppercase tracking-widest text-brand-ink/70 font-medium">Filter</span>
              <input
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                placeholder="Search by name, email, phone, specialty, or property"
                className="mt-1 w-full rounded-md border border-brand-slate/20 bg-white px-3 py-2.5 text-sm" />
            </label>
          </div>
          <label className="flex items-center gap-2 pb-2 text-sm text-brand-slate">
            <input
              type="checkbox"
              checked={showInactive}
              onChange={(e) => setShowInactive(e.target.checked)}
              className="h-4 w-4" />
            Show inactive
          </label>
        </div>

        <div className="mt-4 overflow-hidden rounded-xl border border-brand-slate/15 bg-white">
          <div className="grid grid-cols-[1.4fr_1fr_1fr_1.4fr_1fr_70px] gap-3 px-4 py-2 text-[11px] uppercase tracking-widest text-brand-slate font-medium border-b border-brand-slate/10">
            <div>Name</div>
            <div>Phone</div>
            <div>Email</div>
            <div>Specialties</div>
            <div>Property</div>
            <div className="text-right">Actions</div>
          </div>
          {filtered.length === 0 && (
            <div className="px-4 py-10 text-center text-sm text-brand-slate">
              {vendors.length === 0
                ? 'No vendors yet — add one below or upload your spreadsheet.'
                : 'No vendors match the current filter.'}
            </div>
          )}
          {filtered.map((v) => (
            <div
              key={v.id}
              className={[
                'grid grid-cols-[1.4fr_1fr_1fr_1.4fr_1fr_70px] gap-3 px-4 py-3 text-sm items-center border-b border-brand-slate/10 last:border-b-0',
                v.active ? '' : 'opacity-60',
              ].join(' ')}>
              <div>
                <div className="text-brand-ink font-medium">{v.name}</div>
                {v.notes && <div className="text-xs text-brand-slate truncate">{v.notes}</div>}
              </div>
              <div className="text-xs text-brand-ink tabular-nums">{fmtPhone(v.phone)}</div>
              <div className="text-xs text-brand-ink truncate" title={v.email}>{v.email || '—'}</div>
              <div className="flex flex-wrap gap-1">
                {(v.specialties || []).map((s) => (
                  <span key={s} className="inline-block rounded-full bg-brand-jade/15 text-brand-jade text-[10px] px-2 py-0.5">
                    {s}
                  </span>
                ))}
                {!v.specialties?.length && <span className="text-xs text-brand-slate italic">—</span>}
              </div>
              <div className="flex flex-wrap gap-1">
                {(v.markets || []).map((m) => (
                  <span key={m} className="inline-block rounded-full bg-brand-sand text-brand-ink text-[10px] px-2 py-0.5">
                    {properties.find((p) => p.slug === m)?.name || m}
                  </span>
                ))}
                {!v.markets?.length && <span className="text-xs text-brand-slate italic">All</span>}
              </div>
              <div className="flex justify-end gap-1.5 text-xs">
                <button
                  onClick={() => toggleActive(v)}
                  className="rounded-full border border-brand-ink/30 px-2 py-0.5 text-[10px] text-brand-ink hover:bg-brand-cloud">
                  {v.active ? 'Disable' : 'Enable'}
                </button>
                <button
                  onClick={() => deleteVendor(v)}
                  className="rounded-full border border-rose-300 px-2 py-0.5 text-[10px] text-rose-700 hover:bg-rose-50">
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
        <p className="mt-3 text-xs text-brand-slate">
          {vendors.filter((v) => v.active).length} active · {vendors.filter((v) => !v.active).length} inactive · {vendors.length} total
        </p>
      </section>

      {/* Add Vendor form */}
      <section className="rounded-xl border border-brand-slate/15 bg-white p-6">
        <h2 className="text-xl font-semibold text-brand-ink">Add a vendor</h2>
        <p className="mt-1 text-sm text-brand-slate">
          Adds one row to the roster. Vendors with an email receive dispatch via Gmail today; vendors with a
          phone in E.164 format will receive SMS once Twilio A2P 10DLC clears.
        </p>

        <form onSubmit={submitForm} className="mt-6 grid gap-4 sm:grid-cols-2">
          <label className="block sm:col-span-2">
            <span className="text-xs uppercase tracking-widest text-brand-ink/70 font-medium">Name *</span>
            <input
              required
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              placeholder="Bill's HVAC"
              className="mt-1 w-full rounded-md border border-brand-slate/20 bg-white px-3 py-2.5 text-sm" />
          </label>

          <label className="block">
            <span className="text-xs uppercase tracking-widest text-brand-ink/70 font-medium">Phone</span>
            <input
              value={form.phone}
              onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
              placeholder="+17605551234"
              className="mt-1 w-full rounded-md border border-brand-slate/20 bg-white px-3 py-2.5 text-sm" />
            <span className="text-[11px] text-brand-slate">{PHONE_HINT}</span>
          </label>
          <label className="block">
            <span className="text-xs uppercase tracking-widest text-brand-ink/70 font-medium">Email</span>
            <input
              type="email"
              value={form.email}
              onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
              placeholder="bill@billshvac.com"
              className="mt-1 w-full rounded-md border border-brand-slate/20 bg-white px-3 py-2.5 text-sm" />
          </label>

          <fieldset className="sm:col-span-2">
            <legend className="text-xs uppercase tracking-widest text-brand-ink/70 font-medium">Specialties</legend>
            <div className="mt-2 flex flex-wrap gap-2">
              {categories.map((cat) => (
                <label key={cat} className="inline-flex cursor-pointer items-center gap-1.5">
                  <input
                    type="checkbox"
                    checked={form.specialties.includes(cat)}
                    onChange={() => toggleArrayField('specialties', cat)}
                    className="h-4 w-4" />
                  <span className="text-sm text-brand-ink">{cat}</span>
                </label>
              ))}
            </div>
          </fieldset>

          <fieldset className="sm:col-span-2">
            <legend className="text-xs uppercase tracking-widest text-brand-ink/70 font-medium">Properties served</legend>
            <p className="text-[11px] text-brand-slate">Leave empty to make this vendor available to all properties.</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {properties.map((p) => (
                <label key={p.slug} className="inline-flex cursor-pointer items-center gap-1.5">
                  <input
                    type="checkbox"
                    checked={form.markets.includes(p.slug)}
                    onChange={() => toggleArrayField('markets', p.slug)}
                    className="h-4 w-4" />
                  <span className="text-sm text-brand-ink">{p.name}</span>
                </label>
              ))}
            </div>
          </fieldset>

          <label className="block sm:col-span-2">
            <span className="text-xs uppercase tracking-widest text-brand-ink/70 font-medium">Notes</span>
            <textarea
              rows={2}
              value={form.notes}
              onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
              placeholder="Same-day for emergencies; closed Sunday; cell preferred over office."
              className="mt-1 w-full rounded-md border border-brand-slate/20 bg-white px-3 py-2.5 text-sm" />
          </label>

          <div className="sm:col-span-2 flex items-center gap-3">
            <button
              type="submit"
              disabled={busy}
              className="rounded-full bg-brand-ink px-6 py-2.5 text-sm text-brand-cloud disabled:opacity-50">
              {busy ? 'Adding…' : 'Add vendor'}
            </button>
            <button
              type="button"
              onClick={() => setForm(emptyForm())}
              className="rounded-full border border-brand-ink/30 px-5 py-2.5 text-sm text-brand-ink">
              Clear
            </button>
            {flash && <span className="text-sm text-brand-jade">{flash}</span>}
            {error && <span className="text-sm text-rose-700">{error}</span>}
          </div>
        </form>
      </section>

      {/* Bulk upload */}
      <section className="rounded-xl border border-brand-slate/15 bg-white p-6">
        <h2 className="text-xl font-semibold text-brand-ink">Bulk-import from a spreadsheet</h2>
        <p className="mt-1 text-sm text-brand-slate">
          Upload a <strong>.csv</strong> or <strong>.xlsx</strong> with one vendor per row. Re-uploading is safe:
          rows whose email matches an existing vendor update that row instead of inserting a duplicate.
        </p>
        <p className="mt-3 text-sm text-brand-slate">
          Need the template?{' '}
          <a
            href="/api/maintenance/admin/vendors/template"
            className="text-brand-ink underline underline-offset-4 hover:no-underline">
            Download the CSV template ↓
          </a>{' '}
          — it has the expected column headers and one example row.
        </p>

        <form onSubmit={handleUpload} className="mt-6 flex flex-wrap items-center gap-3">
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv,.xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,text/csv"
            className="block text-sm text-brand-ink file:mr-3 file:rounded-full file:border file:border-brand-ink/30 file:bg-white file:px-4 file:py-2 file:text-sm file:text-brand-ink hover:file:bg-brand-cloud" />
          <button
            type="submit"
            disabled={busy}
            className="rounded-full bg-brand-ink px-6 py-2.5 text-sm text-brand-cloud disabled:opacity-50">
            {busy ? 'Uploading…' : 'Upload & import'}
          </button>
        </form>

        {uploadSummary && (
          <div className="mt-6 rounded-md border border-brand-slate/15 bg-brand-cloud px-4 py-3 text-sm text-brand-ink">
            <div className="font-medium">Import summary</div>
            <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-4 text-xs">
              <Stat label="Parsed rows" value={uploadSummary.parsed ?? 0} />
              <Stat label="Inserted" value={uploadSummary.inserted ?? 0} />
              <Stat label="Updated" value={uploadSummary.updated ?? 0} />
              <Stat label="Skipped" value={uploadSummary.skipped ?? 0} />
            </div>
            {!!uploadSummary.errors?.length && (
              <details className="mt-3">
                <summary className="cursor-pointer text-xs text-rose-700">
                  {uploadSummary.errors.length} error{uploadSummary.errors.length === 1 ? '' : 's'} — click to expand
                </summary>
                <ul className="mt-2 list-disc pl-5 text-xs text-rose-700 space-y-1">
                  {uploadSummary.errors.map((e, i) => (
                    <li key={i}>Row {e.row}: {e.error}</li>
                  ))}
                </ul>
              </details>
            )}
            {!!uploadSummary.warnings?.length && (
              <details className="mt-2">
                <summary className="cursor-pointer text-xs text-amber-800">
                  {uploadSummary.warnings.length} warning{uploadSummary.warnings.length === 1 ? '' : 's'} — click to expand
                </summary>
                <ul className="mt-2 list-disc pl-5 text-xs text-amber-800 space-y-1">
                  {uploadSummary.warnings.map((w, i) => (
                    <li key={i}>Row {w.row}: {w.warning}</li>
                  ))}
                </ul>
              </details>
            )}
          </div>
        )}
      </section>
    </div>
  );
}

function Stat({ label, value }) {
  return (
    <div className="rounded-md bg-brand-sand/60 px-3 py-2">
      <div className="text-[10px] uppercase tracking-widest text-brand-slate">{label}</div>
      <div className="mt-0.5 text-base font-semibold text-brand-ink">{value}</div>
    </div>
  );
}
