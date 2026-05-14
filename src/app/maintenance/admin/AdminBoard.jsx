'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { TicketTimeline } from '@/components/maintenance/TicketTimeline';
import { STATUS_LABELS, formatAge, ageBucket } from '@/lib/maintenance/status';

const PROPERTY_TABS = [
  { key: 'all', label: 'All properties' },
  { key: 'palm-springs', label: 'Sunbath House' },
  { key: 'san-miguel-de-allende', label: 'San Miguel' },
];

const CATEGORY_CHIPS = ['HVAC', 'Plumbing', 'Electrical', 'Appliance', 'Pool', 'Landscape', 'Cleaning', 'Security', 'Pest', 'Other'];

function formatUSD(cents) {
  if (cents == null) return '—';
  return `$${(cents / 100).toLocaleString('en-US', { maximumFractionDigits: 0 })}`;
}

const SEV_COLORS = {
  1: 'bg-emerald-50 text-emerald-900',
  2: 'bg-brand-slate/10 text-brand-ink',
  3: 'bg-amber-50 text-amber-900',
  4: 'bg-rose-50 text-rose-900',
  5: 'bg-rose-100 text-rose-900',
};

const STATUS_COLORS = {
  open: 'bg-brand-slate/15 text-brand-slate',
  assigned: 'bg-brand-jade/15 text-brand-jade',
  in_progress: 'bg-blue-50 text-blue-800',
  awaiting_owner: 'bg-amber-50 text-amber-900',
  diagnosed: 'bg-purple-50 text-purple-800',
  complete: 'bg-emerald-50 text-emerald-800',
  closed: 'bg-brand-slate/15 text-brand-slate',
};

const AGE_COLORS = {
  fresh: 'text-brand-slate',
  warn: 'text-amber-800',
  bad: 'text-rose-700 font-medium',
};

export function AdminBoard({ tickets, kpi }) {
  const router = useRouter();
  const [tab, setTab] = useState('all');
  const [filters, setFilters] = useState(new Set()); // category chips selected
  const [drillId, setDrillId] = useState(null);
  const [savingNote, setSavingNote] = useState(false);
  const [noteFlash, setNoteFlash] = useState('');

  const filtered = useMemo(() => {
    return tickets.filter((t) => {
      if (tab !== 'all' && t.property?.slug !== tab) return false;
      if (filters.size && !filters.has(t.category)) return false;
      return true;
    });
  }, [tickets, tab, filters]);

  const counts = useMemo(() => {
    const c = {};
    for (const cat of CATEGORY_CHIPS) c[cat] = 0;
    for (const t of tickets) if (t.category && c[t.category] != null) c[t.category] += 1;
    return c;
  }, [tickets]);

  const drillTicket = drillId ? tickets.find((t) => t.id === drillId) : null;

  function toggleFilter(cat) {
    const next = new Set(filters);
    if (next.has(cat)) next.delete(cat);
    else next.add(cat);
    setFilters(next);
  }

  async function saveOwnerNote(ticketId, note) {
    setSavingNote(true);
    setNoteFlash('');
    try {
      const r = await fetch('/api/maintenance/admin/notes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ticketId, ownerNotes: note }),
      });
      if (!r.ok) throw new Error('save failed');
      setNoteFlash('Saved.');
      router.refresh();
    } catch (e) {
      setNoteFlash('Error saving — try again.');
    } finally {
      setSavingNote(false);
    }
  }

  return (
    <div className="mt-8">
      {/* Property tabs */}
      <div className="flex gap-1 border-b border-brand-slate/15 pb-0">
        {PROPERTY_TABS.map((t) => {
          const count = t.key === 'all' ? tickets.length : tickets.filter((x) => x.property?.slug === t.key).length;
          return (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={[
                'px-4 py-2 text-sm rounded-md border border-transparent',
                tab === t.key ? 'bg-white border-brand-slate/20 text-brand-ink font-medium' : 'text-brand-slate hover:text-brand-ink',
              ].join(' ')}>
              {t.label} · {count}
            </button>
          );
        })}
      </div>

      {/* KPI tiles */}
      <div className="mt-5 grid grid-cols-2 gap-2 sm:grid-cols-5">
        <Kpi label="Open" value={kpi.open} hint="needs vendor match or response" />
        <Kpi label="In progress" value={kpi.in_progress} hint="vendor working" />
        <Kpi label="Awaiting you" value={kpi.awaiting_owner} hint="cost approval / decision" highlight />
        <Kpi label="Closed this week" value={kpi.closed_this_week} hint="last 7 days" />
        <Kpi label="Open spend (est.)" value={formatUSD(kpi.open_spend_cents)} hint="across open tickets" />
      </div>

      {/* Filter chips */}
      <div className="mt-5 flex flex-wrap gap-1.5">
        <button
          onClick={() => setFilters(new Set())}
          className={[
            'rounded-full border px-3 py-1 text-xs',
            filters.size === 0 ? 'bg-white border-brand-ink/40 text-brand-ink font-medium' : 'border-brand-slate/20 text-brand-slate',
          ].join(' ')}>
          All categories
        </button>
        {CATEGORY_CHIPS.map((cat) =>
          counts[cat] === 0 ? null : (
            <button
              key={cat}
              onClick={() => toggleFilter(cat)}
              className={[
                'rounded-full border px-3 py-1 text-xs',
                filters.has(cat) ? 'bg-white border-brand-ink/40 text-brand-ink font-medium' : 'border-brand-slate/20 text-brand-slate hover:text-brand-ink',
              ].join(' ')}>
              {cat} · {counts[cat]}
            </button>
          ),
        )}
      </div>

      {/* Table */}
      <div className="mt-6 overflow-hidden rounded-xl border border-brand-slate/15 bg-white">
        <div className="grid grid-cols-[120px_1fr_64px_140px_120px_60px] gap-3 px-4 py-2 text-[11px] uppercase tracking-widest text-brand-slate font-medium border-b border-brand-slate/10">
          <div>Property</div><div>Title</div><div className="text-center">Sev</div><div>Vendor</div><div>Status</div><div className="text-right">Age</div>
        </div>
        {filtered.length === 0 && (
          <div className="px-4 py-10 text-center text-sm text-brand-slate">
            No tickets match the current filters.
          </div>
        )}
        {filtered.map((t) => {
          const sev = SEV_COLORS[t.severity] || SEV_COLORS[2];
          const status = STATUS_COLORS[t.status] || STATUS_COLORS.open;
          const ageCls = AGE_COLORS[ageBucket(t.created_at)];
          return (
            <button
              key={t.id}
              onClick={() => setDrillId(t.id === drillId ? null : t.id)}
              className={[
                'grid grid-cols-[120px_1fr_64px_140px_120px_60px] gap-3 w-full px-4 py-3 text-sm items-center text-left border-b border-brand-slate/10 last:border-b-0',
                drillId === t.id ? 'bg-brand-cloud' : 'hover:bg-brand-cloud/50',
              ].join(' ')}>
              <div className="text-xs text-brand-slate truncate">{t.property?.name || '—'}</div>
              <div className="text-brand-ink truncate">{t.title}</div>
              <div className="text-center">
                <span className={`inline-flex items-center justify-center w-7 h-5 rounded text-[11px] font-medium ${sev}`}>
                  {t.severity || '—'}
                </span>
              </div>
              <div className="text-xs text-brand-ink truncate">{t.vendor?.name || <span className="italic text-brand-slate/60">Pending</span>}</div>
              <div>
                <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium ${status}`}>
                  {STATUS_LABELS[t.status] || t.status}
                </span>
              </div>
              <div className={`text-right text-xs tabular-nums ${ageCls}`}>{formatAge(t.created_at)}</div>
            </button>
          );
        })}
      </div>

      {/* Drill-in panel */}
      {drillTicket && (
        <div className="mt-6 rounded-xl border border-brand-slate/15 bg-white p-6">
          <div className="flex items-baseline justify-between">
            <div>
              <p className="text-xs uppercase tracking-widest text-brand-slate">Ticket · {drillTicket.id.slice(0, 8)}</p>
              <h2 className="mt-1 text-xl font-semibold text-brand-ink">{drillTicket.title}</h2>
              <p className="mt-1 text-sm text-brand-slate">
                {drillTicket.property?.name || '—'} · {drillTicket.category || 'Uncategorized'} · {formatAge(drillTicket.created_at)} ago
              </p>
            </div>
            <button onClick={() => setDrillId(null)} className="text-sm text-brand-slate underline">Close</button>
          </div>

          <div className="mt-5">
            <div className="text-xs uppercase tracking-widest text-brand-ink/70 font-medium">Timeline</div>
            <TicketTimeline status={drillTicket.status} history={drillTicket.status_history} />
          </div>

          <div className="mt-5 grid gap-4 sm:grid-cols-2 text-sm">
            <div className="rounded-md bg-brand-sand px-4 py-3">
              <div className="text-xs uppercase tracking-widest text-brand-ink/70 font-medium mb-1">Guest description</div>
              <div className="text-brand-ink/85 leading-relaxed whitespace-pre-wrap">{drillTicket.description}</div>
            </div>
            <div className="rounded-md border border-brand-slate/15 px-4 py-3">
              <div className="text-xs uppercase tracking-widest text-brand-ink/70 font-medium mb-1">Triage reasoning</div>
              <div className="text-brand-ink/85 italic">{drillTicket.triage_meta?.reasoning || '—'}</div>
            </div>
            {drillTicket.vendor_notes && (
              <div className="rounded-md border border-brand-jade/30 bg-brand-jade/5 px-4 py-3 sm:col-span-2">
                <div className="text-xs uppercase tracking-widest text-brand-jade font-medium mb-1">Vendor notes</div>
                <div className="text-brand-ink/85 whitespace-pre-wrap">{drillTicket.vendor_notes}</div>
              </div>
            )}
            <div className="text-xs text-brand-slate sm:col-span-2">
              Cost estimate: <span className="text-brand-ink font-medium">{formatUSD(drillTicket.cost_estimate_cents)}</span> ·
              Final: <span className="text-brand-ink font-medium">{formatUSD(drillTicket.cost_final_cents)}</span> ·
              Reported by: <span className="text-brand-ink font-medium">{drillTicket.reported_by}</span>
              {drillTicket.vendor_token && (
                <> · <Link href={`/maintenance/vendor/${drillTicket.vendor_token}`} className="underline">Vendor portal ↗</Link></>
              )}
              {' · '}<Link href={`/maintenance/status/${drillTicket.id}`} className="underline">Guest status ↗</Link>
            </div>
          </div>

          <div className="mt-5">
            <label className="block">
              <span className="text-xs uppercase tracking-widest text-brand-ink/70 font-medium">Owner notes (private)</span>
              <OwnerNoteField
                ticketId={drillTicket.id}
                initial={drillTicket.owner_notes || ''}
                onSave={(note) => saveOwnerNote(drillTicket.id, note)}
                saving={savingNote}
                flash={noteFlash}
              />
            </label>
          </div>
        </div>
      )}

      {/* Bottom: patterns + vendor perf — derived in JS so it stays in sync */}
      <PatternsAndVendors tickets={tickets} />
    </div>
  );
}

function Kpi({ label, value, hint, highlight }) {
  return (
    <div className={[
      'rounded-md p-4',
      highlight ? 'bg-amber-50' : 'bg-brand-sand/60',
    ].join(' ')}>
      <div className={['text-[11px] uppercase tracking-widest font-medium', highlight ? 'text-amber-900' : 'text-brand-slate'].join(' ')}>
        {label}
      </div>
      <div className={['text-2xl font-semibold mt-1', highlight ? 'text-amber-900' : 'text-brand-ink'].join(' ')}>
        {value}
      </div>
      {hint && <div className={['text-[11px] mt-1', highlight ? 'text-amber-800' : 'text-brand-slate/80'].join(' ')}>{hint}</div>}
    </div>
  );
}

function OwnerNoteField({ ticketId, initial, onSave, saving, flash }) {
  const [val, setVal] = useState(initial);
  return (
    <div className="mt-1">
      <textarea
        rows={3}
        value={val}
        onChange={(e) => setVal(e.target.value)}
        placeholder="Private notes only you see. Decisions, vendor preferences, approval ceilings."
        className="w-full rounded-md border border-brand-slate/20 bg-white px-3 py-2 text-sm" />
      <div className="mt-2 flex items-center gap-3">
        <button
          onClick={() => onSave(val)}
          disabled={saving}
          className="rounded-full border border-brand-ink/40 px-4 py-1.5 text-xs text-brand-ink disabled:opacity-50">
          {saving ? 'Saving…' : 'Save note'}
        </button>
        {flash && <span className="text-xs text-brand-jade">{flash}</span>}
      </div>
    </div>
  );
}

function PatternsAndVendors({ tickets }) {
  // Compute simple patterns: category × property counts in last 90 days.
  const ninety = Date.now() - 90 * 86_400_000;
  const recent = tickets.filter((t) => new Date(t.created_at).getTime() >= ninety);
  const catProp = {};
  for (const t of recent) {
    if (!t.category || !t.property?.name) continue;
    const k = `${t.category} at ${t.property.name}`;
    catProp[k] = (catProp[k] || 0) + 1;
  }
  const patterns = Object.entries(catProp).filter(([, n]) => n >= 2).sort((a, b) => b[1] - a[1]).slice(0, 5);

  // Vendor performance: count of closed tickets per vendor.
  const vendorClosed = {};
  for (const t of tickets) {
    if (t.status !== 'closed' && t.status !== 'complete') continue;
    const n = t.vendor?.name;
    if (!n) continue;
    vendorClosed[n] = (vendorClosed[n] || 0) + 1;
  }
  const vendors = Object.entries(vendorClosed).sort((a, b) => b[1] - a[1]).slice(0, 5);

  if (!patterns.length && !vendors.length) return null;

  return (
    <div className="mt-8 grid gap-4 sm:grid-cols-2">
      {patterns.length > 0 && (
        <div className="rounded-xl border border-brand-slate/15 bg-white p-5">
          <div className="text-[11px] uppercase tracking-widest text-brand-slate font-medium">Recurring patterns · 90d</div>
          <ul className="mt-3 divide-y divide-brand-slate/10 text-sm">
            {patterns.map(([k, n]) => (
              <li key={k} className="flex justify-between py-2">
                <span>
                  {k}{' '}
                  {n >= 3 && (
                    <span className="ml-2 inline-block rounded-md bg-amber-100 text-amber-900 text-[10px] px-1.5 py-0.5 font-medium">
                      capex flag
                    </span>
                  )}
                </span>
                <span className="text-brand-slate">{n} tickets</span>
              </li>
            ))}
          </ul>
        </div>
      )}
      {vendors.length > 0 && (
        <div className="rounded-xl border border-brand-slate/15 bg-white p-5">
          <div className="text-[11px] uppercase tracking-widest text-brand-slate font-medium">Vendor performance · all time</div>
          <ul className="mt-3 divide-y divide-brand-slate/10 text-sm">
            {vendors.map(([n, c]) => (
              <li key={n} className="flex justify-between py-2">
                <span>{n}</span>
                <span className="text-brand-slate">{c} completed</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
