'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Wrench, Clock, AlertTriangle, CheckCircle2, ChevronDown } from 'lucide-react';
import { usd } from '@/lib/utils/format';

const STATUS_LABEL = {
  open: 'Open',
  in_progress: 'In progress',
  scheduled: 'Scheduled',
  completed: 'Completed',
  cancelled: 'Cancelled',
};
const STATUS_STYLE = {
  open: 'bg-brand-terracotta/15 text-brand-terracotta',
  in_progress: 'bg-brand-gold/15 text-brand-gold',
  scheduled: 'bg-brand-slate/15 text-brand-slate',
  completed: 'bg-brand-jade/15 text-brand-jade',
  cancelled: 'bg-brand-tan/60 text-brand-slate',
};
const PRIORITY_STYLE = {
  low: 'text-brand-slate',
  normal: 'text-brand-slate',
  high: 'text-brand-terracotta',
  urgent: 'text-brand-terracotta font-semibold',
};

export function MaintenanceList({ items = [] }) {
  const [filter, setFilter] = useState('all');
  const filtered = filter === 'all' ? items : items.filter((i) => i.status === filter);

  return (
    <div>
      <div className="flex flex-wrap items-center gap-2">
        {['all', 'open', 'in_progress', 'scheduled', 'completed'].map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`rounded-full border px-3 py-1 text-xs ${
              filter === f
                ? 'border-brand-ink bg-brand-ink text-brand-cloud'
                : 'border-brand-tan/60 bg-brand-cloud text-brand-slate hover:border-brand-ink'
            }`}
          >
            {f === 'all' ? `All (${items.length})` : `${STATUS_LABEL[f]} (${items.filter((i) => i.status === f).length})`}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="mt-6 rounded-2xl border border-dashed border-brand-tan bg-brand-sand/30 p-10 text-center">
          <Wrench className="mx-auto text-brand-slate/60" size={28} />
          <p className="mt-3 text-sm text-brand-slate">
            {filter === 'all'
              ? 'No maintenance requests yet — submit the first one above.'
              : `No ${STATUS_LABEL[filter].toLowerCase()} requests.`}
          </p>
        </div>
      ) : (
        <ul className="mt-6 space-y-3">
          {filtered.map((item) => (
            <RequestRow key={item.id} item={item} />
          ))}
        </ul>
      )}
    </div>
  );
}

function RequestRow({ item }) {
  const router = useRouter();
  const [expanded, setExpanded] = useState(false);
  const [updating, setUpdating] = useState(false);

  async function updateStatus(newStatus) {
    setUpdating(true);
    await fetch(`/api/maintenance/${item.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: newStatus }),
    });
    router.refresh();
    setUpdating(false);
  }

  return (
    <li className="rounded-2xl border border-brand-tan/60 bg-brand-cloud p-4 shadow-soft">
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        className="flex w-full items-start gap-4 text-left"
      >
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand-sand/60">
          {item.priority === 'urgent' ? (
            <AlertTriangle size={16} className="text-brand-terracotta" />
          ) : item.status === 'completed' ? (
            <CheckCircle2 size={16} className="text-brand-jade" />
          ) : (
            <Clock size={16} className="text-brand-slate" />
          )}
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className={`rounded-full px-2 py-0.5 text-[10px] uppercase tracking-widest ${STATUS_STYLE[item.status]}`}>
              {STATUS_LABEL[item.status]}
            </span>
            <span className={`text-[10px] uppercase tracking-widest ${PRIORITY_STYLE[item.priority]}`}>
              {item.priority}
            </span>
            <span className="text-[10px] uppercase tracking-widest text-brand-slate/60">
              {item.property?.short_name || item.property?.name}
            </span>
            {item.category && (
              <span className="text-[10px] uppercase tracking-widest text-brand-slate/60">· {item.category}</span>
            )}
          </div>
          <p className="mt-1.5 text-sm font-medium text-brand-ink">{item.title}</p>
          {item.description && !expanded && (
            <p className="mt-0.5 line-clamp-1 text-xs text-brand-slate">{item.description}</p>
          )}
        </div>

        <ChevronDown
          size={16}
          className={`mt-1 shrink-0 text-brand-slate transition-transform ${expanded ? 'rotate-180' : ''}`}
        />
      </button>

      {expanded && (
        <div className="mt-4 border-t border-brand-tan/60 pt-4 text-sm">
          {item.description && (
            <p className="text-brand-slate">{item.description}</p>
          )}
          <dl className="mt-3 grid grid-cols-2 gap-x-6 gap-y-2 text-xs text-brand-slate">
            {item.vendor_assigned && <Row k="Vendor" v={item.vendor_assigned} />}
            {item.vendor_contact && <Row k="Contact" v={item.vendor_contact} />}
            {item.estimated_cost != null && <Row k="Est. cost" v={usd(item.estimated_cost)} />}
            {item.actual_cost != null && <Row k="Actual cost" v={usd(item.actual_cost)} />}
            {item.scheduled_for && <Row k="Scheduled" v={item.scheduled_for} />}
            {item.reporter_email && <Row k="Reporter" v={item.reporter_email} />}
            <Row k="Created" v={new Date(item.created_at).toLocaleDateString()} />
            {item.resolved_at && (
              <Row k="Resolved" v={new Date(item.resolved_at).toLocaleDateString()} />
            )}
          </dl>

          <div className="mt-4 flex flex-wrap items-center gap-2">
            {['open', 'in_progress', 'scheduled', 'completed', 'cancelled']
              .filter((s) => s !== item.status)
              .map((s) => (
                <button
                  key={s}
                  type="button"
                  disabled={updating}
                  onClick={() => updateStatus(s)}
                  className="rounded-full border border-brand-tan/60 bg-brand-cloud px-3 py-1 text-[11px] uppercase tracking-widest text-brand-slate hover:border-brand-ink hover:text-brand-ink disabled:opacity-50"
                >
                  → {STATUS_LABEL[s]}
                </button>
              ))}
          </div>
        </div>
      )}
    </li>
  );
}

function Row({ k, v }) {
  return (
    <div>
      <dt className="text-[10px] uppercase tracking-widest text-brand-slate/60">{k}</dt>
      <dd className="text-brand-ink">{v}</dd>
    </div>
  );
}
