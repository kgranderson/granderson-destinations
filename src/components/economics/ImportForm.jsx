'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Upload, FileSpreadsheet, CheckCircle2, AlertCircle, RefreshCw } from 'lucide-react';
import { PROPERTIES } from '@/lib/constants';

export function ImportForm({ initialSlug }) {
  const router = useRouter();
  const [propertySlug, setPropertySlug] = useState(initialSlug);
  const [file, setFile] = useState(null);
  const [mode, setMode] = useState('append');
  const [isDragging, setIsDragging] = useState(false);
  const [status, setStatus] = useState({ kind: 'idle' });

  async function onSubmit(e) {
    e.preventDefault();
    if (!file) {
      setStatus({ kind: 'error', message: 'Pick a file first.' });
      return;
    }
    setStatus({ kind: 'uploading' });
    const fd = new FormData();
    fd.append('file', file);
    fd.append('propertySlug', propertySlug);
    fd.append('mode', mode);

    let res;
    try {
      res = await fetch('/api/economics/import', { method: 'POST', body: fd });
    } catch (err) {
      setStatus({ kind: 'error', message: String(err) });
      return;
    }
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      setStatus({
        kind: 'error',
        message: data.error || `Import failed (HTTP ${res.status})`,
        errors: data.errors,
      });
      return;
    }
    setStatus({ kind: 'success', data });
    // After 2s, redirect to the property's economics page (cache already busted server-side)
    setTimeout(() => router.push(`/economics/${propertySlug}`), 2000);
  }

  function onDrop(e) {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files?.[0]) setFile(e.dataTransfer.files[0]);
  }

  return (
    <form onSubmit={onSubmit} className="space-y-5">
      {/* Property picker */}
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs uppercase tracking-widest text-brand-slate/70">Property</span>
        <div className="flex flex-wrap gap-2">
          {PROPERTIES.map((p) => (
            <button
              type="button"
              key={p.slug}
              onClick={() => setPropertySlug(p.slug)}
              className={`rounded-full border px-4 py-1.5 text-sm transition-colors ${
                propertySlug === p.slug
                  ? 'border-brand-ink bg-brand-ink text-brand-cloud'
                  : 'border-brand-tan/60 bg-brand-cloud text-brand-slate hover:border-brand-ink hover:text-brand-ink'
              }`}
            >
              {p.shortName}
            </button>
          ))}
        </div>
      </div>

      {/* Drop zone */}
      <label
        htmlFor="t12-file"
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={onDrop}
        className={`flex cursor-pointer flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed p-10 text-center transition-colors ${
          isDragging
            ? 'border-brand-ink bg-brand-tan/30'
            : file
            ? 'border-brand-jade/50 bg-brand-jade/10'
            : 'border-brand-tan/60 bg-brand-sand/30 hover:border-brand-ink/60'
        }`}
      >
        {file ? (
          <>
            <FileSpreadsheet className="text-brand-jade" size={32} />
            <p className="text-sm font-medium text-brand-ink">{file.name}</p>
            <p className="text-xs text-brand-slate">
              {(file.size / 1024).toFixed(1)} KB · click to replace
            </p>
          </>
        ) : (
          <>
            <Upload className="text-brand-slate" size={32} />
            <p className="text-sm font-medium text-brand-ink">Drop your P&L file here</p>
            <p className="text-xs text-brand-slate">CSV or Excel · up to 4 MB</p>
          </>
        )}
        <input
          id="t12-file"
          type="file"
          accept=".csv,.xlsx,.xls,.xlsm"
          onChange={(e) => setFile(e.target.files?.[0] || null)}
          className="sr-only"
        />
      </label>

      {/* Mode */}
      <fieldset className="rounded-xl border border-brand-tan/60 bg-brand-cloud p-4">
        <legend className="px-2 text-xs uppercase tracking-widest text-brand-slate/70">
          Conflict handling
        </legend>
        <label className="flex cursor-pointer items-start gap-3 py-2">
          <input
            type="radio"
            name="mode"
            value="append"
            checked={mode === 'append'}
            onChange={() => setMode('append')}
            className="mt-1 accent-brand-gold"
          />
          <span className="text-sm">
            <strong className="block text-brand-ink">Append (recommended)</strong>
            <span className="text-brand-slate">
              Replaces existing rows only for the months in your file. Older months are untouched.
            </span>
          </span>
        </label>
        <label className="flex cursor-pointer items-start gap-3 py-2">
          <input
            type="radio"
            name="mode"
            value="replace-all-history"
            checked={mode === 'replace-all-history'}
            onChange={() => setMode('replace-all-history')}
            className="mt-1 accent-brand-terracotta"
          />
          <span className="text-sm">
            <strong className="block text-brand-ink">Replace all history</strong>
            <span className="text-brand-slate">
              Wipes <em>every</em> existing row for this property, then inserts your file. Use only
              when re-importing the entire history from scratch.
            </span>
          </span>
        </label>
      </fieldset>

      {/* Submit */}
      <button
        type="submit"
        disabled={!file || status.kind === 'uploading'}
        className="inline-flex items-center gap-2 rounded-full bg-brand-ink px-6 py-3 text-sm font-medium text-brand-cloud hover:bg-brand-slate disabled:opacity-50"
      >
        {status.kind === 'uploading' ? (
          <RefreshCw size={14} className="animate-spin" />
        ) : (
          <Upload size={14} />
        )}
        {status.kind === 'uploading' ? 'Uploading…' : 'Import'}
      </button>

      {/* Status */}
      {status.kind === 'success' && (
        <div className="flex items-start gap-2 rounded-md border border-brand-jade/40 bg-brand-jade/10 p-4 text-sm text-brand-jade">
          <CheckCircle2 size={18} className="mt-0.5 shrink-0" />
          <div>
            <p className="font-medium">
              Imported {status.data.rowsInserted} rows across {status.data.monthsTouched} months for{' '}
              {status.data.propertyName}.
            </p>
            <p className="mt-1 text-brand-slate">Redirecting to the dashboard…</p>
          </div>
        </div>
      )}

      {status.kind === 'error' && (
        <div className="rounded-md border border-brand-terracotta/40 bg-brand-terracotta/10 p-4 text-sm text-brand-terracotta">
          <div className="flex items-start gap-2">
            <AlertCircle size={18} className="mt-0.5 shrink-0" />
            <p className="font-medium">{status.message}</p>
          </div>
          {status.errors?.length ? (
            <ul className="ml-7 mt-2 list-disc text-xs text-brand-slate">
              {status.errors.map((e, i) => (
                <li key={i}>{e}</li>
              ))}
            </ul>
          ) : null}
        </div>
      )}
    </form>
  );
}
