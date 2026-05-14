/**
 * Visual status timeline. Used on:
 *   - /maintenance/status/[id]      (public guest view, read-only)
 *   - /maintenance/vendor/[token]   (vendor portal, read-only)
 *   - /maintenance/admin            (drill-in detail panel, read-only)
 *
 * The component is intentionally dumb — it just renders steps from a list.
 * Status transitions happen elsewhere (vendor portal or admin endpoints).
 */

const STEPS = [
  { key: 'open', label: 'Reported' },
  { key: 'assigned', label: 'Vendor matched' },
  { key: 'in_progress', label: 'In progress' },
  { key: 'diagnosed', label: 'Diagnosed' },
  { key: 'complete', label: 'Complete' },
];

function statusIndex(s) {
  const i = STEPS.findIndex((x) => x.key === s);
  if (i >= 0) return i;
  if (s === 'awaiting_owner') return 2; // share the "in progress" slot
  if (s === 'closed') return STEPS.length - 1;
  return 0;
}

function findHistoryAt(history, status) {
  if (!Array.isArray(history)) return null;
  // Find the most recent transition into this status (handles re-entry).
  for (let i = history.length - 1; i >= 0; i -= 1) {
    if (history[i].status === status) return history[i].at;
  }
  return null;
}

function formatTime(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  return d.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

export function TicketTimeline({ status, history }) {
  const currentIdx = statusIndex(status);
  return (
    <div className="grid grid-cols-5 gap-0 mt-1 text-xs">
      {STEPS.map((step, i) => {
        const done = i < currentIdx;
        const cur = i === currentIdx;
        const at = findHistoryAt(history, step.key);
        return (
          <div
            key={step.key}
            className={[
              'pt-2 px-2 border-t-2 text-center',
              done && 'border-brand-jade text-brand-jade',
              cur && 'border-blue-600 text-blue-700 font-medium',
              !done && !cur && 'border-brand-slate/20 text-brand-slate/60',
            ]
              .filter(Boolean)
              .join(' ')}>
            <div className="leading-tight">{step.label}</div>
            {at && <div className="text-[10px] mt-0.5 opacity-70">{formatTime(at)}</div>}
          </div>
        );
      })}
    </div>
  );
}
