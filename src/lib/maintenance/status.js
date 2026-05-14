/**
 * Maintenance ticket status state machine.
 *
 * Status transitions intentionally one-directional during the happy path so
 * the timeline visualization on the guest status page and admin dashboard
 * stays simple. The owner can force-close at any point via the dashboard.
 */

export const STATUSES = [
  'open',          // ticket just created, no vendor action yet
  'assigned',      // vendor has been notified (dispatch sent)
  'in_progress',   // vendor has acknowledged or is on site
  'awaiting_owner',// vendor flagged something needing owner decision (cost approval, replace vs. repair)
  'diagnosed',     // vendor knows the issue, may have submitted an estimate
  'complete',      // work finished
  'closed',        // ticket archived — owner-initiated, vendor-completed, or won't-fix
];

export const STATUS_LABELS = {
  open: 'Open',
  assigned: 'Assigned',
  in_progress: 'In progress',
  awaiting_owner: 'Awaiting you',
  diagnosed: 'Diagnosed',
  complete: 'Complete',
  closed: 'Closed',
};

// Status pill colors keyed to the brand palette. Used by both guest status
// page and admin dashboard so a "complete" ticket reads identically in both.
export const STATUS_PILL_CLASS = {
  open: 'bg-brand-slate/10 text-brand-slate',
  assigned: 'bg-brand-jade/10 text-brand-jade',
  in_progress: 'bg-blue-50 text-blue-800',
  awaiting_owner: 'bg-amber-50 text-amber-800',
  diagnosed: 'bg-purple-50 text-purple-800',
  complete: 'bg-emerald-50 text-emerald-800',
  closed: 'bg-brand-slate/15 text-brand-slate',
};

// What's allowed next given the current status. Owner can override anything
// from /maintenance/admin (no transition guards on the admin endpoint).
export const VENDOR_TRANSITIONS = {
  open: ['assigned', 'in_progress'],
  assigned: ['in_progress', 'awaiting_owner', 'diagnosed'],
  in_progress: ['awaiting_owner', 'diagnosed', 'complete'],
  awaiting_owner: ['in_progress', 'diagnosed', 'complete'],
  diagnosed: ['in_progress', 'awaiting_owner', 'complete'],
  complete: ['closed'],
  closed: [],
};

/**
 * Append a new status entry to the status_history JSONB array.
 *   prior:   the existing array (null/undefined becomes [])
 *   status:  the new status string
 *   by:      'vendor' | 'owner' | 'guest' | 'system'
 *   note:    optional free-form note
 */
export function appendHistory(prior, status, by, note) {
  const history = Array.isArray(prior) ? prior : [];
  return [
    ...history,
    {
      status,
      at: new Date().toISOString(),
      by,
      ...(note ? { note } : {}),
    },
  ];
}

/**
 * Generate a URL-safe random token for the vendor portal. 32 chars of
 * base64url (24 bytes of entropy) — enough for ~10^57 ticket-space.
 */
export function generateVendorToken() {
  const bytes = new Uint8Array(24);
  if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
    crypto.getRandomValues(bytes);
  } else {
    // Server-side fallback — Node has crypto.randomBytes via webcrypto in Node 18+.
    // eslint-disable-next-line global-require
    const nodeCrypto = require('crypto');
    nodeCrypto.randomFillSync(bytes);
  }
  return Buffer.from(bytes)
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

/**
 * Render age string from a created_at timestamp:
 *   <60s   → "just now"
 *   <60m   → "Nm"
 *   <24h   → "Nh"
 *   <30d   → "Nd"
 *   else   → "MMM d"
 */
export function formatAge(createdAt) {
  if (!createdAt) return '';
  const ms = Date.now() - new Date(createdAt).getTime();
  if (ms < 60_000) return 'just now';
  const m = Math.floor(ms / 60_000);
  if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h`;
  const d = Math.floor(h / 24);
  if (d < 30) return `${d}d`;
  return new Date(createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export function ageBucket(createdAt) {
  if (!createdAt) return 'fresh';
  const h = (Date.now() - new Date(createdAt).getTime()) / 3_600_000;
  if (h >= 72) return 'bad';
  if (h >= 24) return 'warn';
  return 'fresh';
}
