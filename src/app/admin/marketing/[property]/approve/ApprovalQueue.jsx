'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Check,
  X,
  Edit2,
  Save,
  RotateCcw,
  AlertTriangle,
  CheckCircle2,
  CalendarClock,
  Image as ImageIcon,
} from 'lucide-react';

/**
 * Approval queue UI. Each card shows: image preview, caption, hashtags,
 * scheduled time, source campaign. Operator can:
 *  - Approve (one click → flips approval_status to 'approved')
 *  - Reject  (modal asks for reason → flips to 'rejected')
 *  - Edit    (inline form for caption + scheduled_at + hashtags)
 *
 * Approve/reject removes the card from the queue immediately (optimistic).
 * If the server rejects, the post comes back with the original status.
 */
export function ApprovalQueue({
  propertySlug,
  propertyShortName,
  initialPosts,
  includeApproved,
  credsConnected,
  filteredCampaignId,
}) {
  const router = useRouter();
  const [posts, setPosts] = useState(initialPosts);
  const [editing, setEditing] = useState(null); // post.id being edited inline
  const [flash, setFlash] = useState(null);

  function showFlash(message, ok = true) {
    setFlash({ ok, message });
    setTimeout(() => setFlash(null), 3500);
  }

  async function approve(post) {
    // Optimistic remove
    setPosts((prev) => prev.filter((p) => p.id !== post.id));
    try {
      const r = await fetch(`/api/admin/marketing/posts/${post.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'approve' }),
      });
      if (!r.ok) {
        const json = await r.json().catch(() => ({}));
        throw new Error(json.error || `Approve failed (${r.status})`);
      }
      showFlash(`Approved — will publish at ${shortTime(post.scheduled_at)}.`, true);
    } catch (err) {
      // Roll back the optimistic remove
      setPosts((prev) => [post, ...prev]);
      showFlash(err.message, false);
    }
  }

  async function reject(post) {
    const reason = window.prompt('Reason for rejecting? (optional, helps when reviewing later)');
    if (reason === null) return; // user cancelled
    setPosts((prev) => prev.filter((p) => p.id !== post.id));
    try {
      const r = await fetch(`/api/admin/marketing/posts/${post.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'reject', reason }),
      });
      if (!r.ok) {
        const json = await r.json().catch(() => ({}));
        throw new Error(json.error || `Reject failed (${r.status})`);
      }
      showFlash('Rejected.', true);
    } catch (err) {
      setPosts((prev) => [post, ...prev]);
      showFlash(err.message, false);
    }
  }

  async function saveEdit(post, fields) {
    try {
      const r = await fetch(`/api/admin/marketing/posts/${post.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'edit', fields }),
      });
      const json = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(json.error || `Save failed (${r.status})`);
      // Replace the post in-place with the server's canonical version
      setPosts((prev) => prev.map((p) => (p.id === post.id ? json.post : p)));
      setEditing(null);
      showFlash('Saved.', true);
    } catch (err) {
      showFlash(err.message, false);
    }
  }

  return (
    <div className="mt-8 space-y-6">
      {/* Cred warning */}
      {!credsConnected && (
        <div className="rounded-2xl border border-amber-200 bg-amber-50/60 p-4 text-sm text-amber-900">
          <div className="flex items-start gap-2">
            <AlertTriangle size={16} className="mt-0.5" />
            <div>
              <strong>Meta credentials not connected.</strong> Approved posts will sit in the
              queue as &ldquo;stubbed&rdquo; until you connect this property&rsquo;s IG Business
              account in{' '}
              <Link
                href={`/admin/marketing/${propertySlug}/settings`}
                className="underline underline-offset-4 hover:text-amber-700"
              >
                Settings →
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Filter bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-brand-slate">
        <div>
          {posts.length} post{posts.length === 1 ? '' : 's'}
          {filteredCampaignId && (
            <>
              {' · '}
              <Link
                href={`/admin/marketing/${propertySlug}/approve`}
                className="underline underline-offset-4 hover:text-brand-ink"
              >
                Clear campaign filter
              </Link>
            </>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Link
            href={`/admin/marketing/${propertySlug}/approve${
              includeApproved ? '' : '?show=all'
            }`}
            className="rounded-full border border-brand-ink/30 px-3 py-1 hover:bg-brand-sand/50"
          >
            {includeApproved ? 'Hide approved' : 'Show approved too'}
          </Link>
        </div>
      </div>

      {/* Flash */}
      {flash && (
        <div
          className={`flex items-start gap-2 rounded-md p-3 text-sm ${
            flash.ok ? 'bg-brand-jade/10 text-brand-jade' : 'bg-rose-50 text-rose-800'
          }`}
        >
          {flash.ok ? <CheckCircle2 size={16} /> : <AlertTriangle size={16} />}
          {flash.message}
        </div>
      )}

      {/* Empty */}
      {posts.length === 0 && (
        <div className="rounded-2xl border border-dashed border-brand-tan bg-brand-sand/20 p-8 text-center text-sm text-brand-slate">
          {includeApproved
            ? 'Nothing in the queue. Create a campaign to generate drafts.'
            : 'No pending posts. Click "Show approved too" above to see scheduled-and-approved posts.'}
        </div>
      )}

      {/* Cards */}
      <div className="grid gap-4 lg:grid-cols-2">
        {posts.map((post) => (
          <PostCard
            key={post.id}
            post={post}
            propertyShortName={propertyShortName}
            editing={editing === post.id}
            onStartEdit={() => setEditing(post.id)}
            onCancelEdit={() => setEditing(null)}
            onSaveEdit={(fields) => saveEdit(post, fields)}
            onApprove={() => approve(post)}
            onReject={() => reject(post)}
          />
        ))}
      </div>
    </div>
  );
}

function PostCard({
  post,
  propertyShortName,
  editing,
  onStartEdit,
  onCancelEdit,
  onSaveEdit,
  onApprove,
  onReject,
}) {
  const approved = post.approval_status === 'approved';
  return (
    <article className="overflow-hidden rounded-2xl border border-brand-tan/60 bg-brand-cloud shadow-soft">
      {/* Image preview — fall back to a tinted placeholder if no URL */}
      <div className="relative aspect-[4/3] bg-brand-sand/40">
        {post.image_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={post.image_url}
            alt={post.caption?.slice(0, 80) || `${propertyShortName} draft post`}
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-brand-slate/60">
            <ImageIcon size={28} />
          </div>
        )}
        {approved && (
          <span className="absolute right-2 top-2 rounded-full bg-brand-jade px-2 py-0.5 text-[10px] uppercase tracking-widest text-brand-cloud">
            Approved
          </span>
        )}
        {post.campaign?.name && (
          <span className="absolute left-2 top-2 rounded-full bg-brand-ink/80 px-2 py-0.5 text-[10px] uppercase tracking-widest text-brand-cloud">
            {post.campaign.name}
          </span>
        )}
      </div>

      <div className="p-4">
        <div className="flex items-center gap-2 text-xs text-brand-slate">
          <CalendarClock size={12} />
          {fmtScheduled(post.scheduled_at)}
          {post.theme && (
            <>
              <span aria-hidden>·</span>
              <span className="rounded-full bg-brand-sand/60 px-2 py-px text-[10px] uppercase tracking-widest">
                {post.theme}
              </span>
            </>
          )}
        </div>

        {editing ? (
          <InlineEditor post={post} onSave={onSaveEdit} onCancel={onCancelEdit} />
        ) : (
          <>
            <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-brand-ink">
              {post.caption || <span className="text-brand-slate/50">(no caption)</span>}
            </p>
            {post.hashtags?.length > 0 && (
              <p className="mt-2 text-xs text-brand-slate/70">
                {post.hashtags.join(' ')}
              </p>
            )}

            <div className="mt-4 flex flex-wrap items-center gap-2">
              {!approved && (
                <button
                  type="button"
                  onClick={onApprove}
                  className="inline-flex items-center gap-1 rounded-full bg-brand-ink px-3 py-1 text-xs text-brand-cloud hover:bg-brand-ink/85"
                >
                  <Check size={12} /> Approve
                </button>
              )}
              <button
                type="button"
                onClick={onStartEdit}
                className="inline-flex items-center gap-1 rounded-full border border-brand-ink/30 px-3 py-1 text-xs text-brand-ink hover:bg-brand-sand/50"
              >
                <Edit2 size={12} /> Edit
              </button>
              {!approved && (
                <button
                  type="button"
                  onClick={onReject}
                  className="inline-flex items-center gap-1 rounded-full border border-rose-300 px-3 py-1 text-xs text-rose-700 hover:bg-rose-50"
                >
                  <X size={12} /> Reject
                </button>
              )}
            </div>
          </>
        )}
      </div>
    </article>
  );
}

function InlineEditor({ post, onSave, onCancel }) {
  const [caption, setCaption] = useState(post.caption || '');
  const [scheduledAt, setScheduledAt] = useState(
    post.scheduled_at ? post.scheduled_at.slice(0, 16) : '',
  );
  const [hashtagsStr, setHashtagsStr] = useState(
    Array.isArray(post.hashtags) ? post.hashtags.join(' ') : '',
  );
  const [imageUrl, setImageUrl] = useState(post.image_url || '');
  const [busy, setBusy] = useState(false);

  async function submit() {
    setBusy(true);
    const hashtags = hashtagsStr
      .split(/\s+/)
      .map((t) => t.trim())
      .filter((t) => t.length > 0);
    // Append timezone offset back onto datetime-local for ISO compat
    const iso = scheduledAt ? `${scheduledAt}:00` : post.scheduled_at;
    await onSave({
      caption,
      scheduled_at: iso,
      hashtags,
      image_url: imageUrl,
    });
    setBusy(false);
  }

  return (
    <div className="mt-3 space-y-2 text-sm">
      <label className="block">
        <span className="text-[10px] uppercase tracking-widest text-brand-slate/70">Caption</span>
        <textarea
          rows={4}
          value={caption}
          onChange={(e) => setCaption(e.target.value)}
          className="mt-0.5 w-full rounded-md border border-brand-slate/20 bg-white px-2 py-1.5 text-sm text-brand-ink placeholder:text-brand-slate/55"
        />
      </label>
      <label className="block">
        <span className="text-[10px] uppercase tracking-widest text-brand-slate/70">Hashtags (space-separated)</span>
        <input
          type="text"
          value={hashtagsStr}
          onChange={(e) => setHashtagsStr(e.target.value)}
          className="mt-0.5 w-full rounded-md border border-brand-slate/20 bg-white px-2 py-1.5 font-mono text-xs text-brand-ink placeholder:text-brand-slate/55"
        />
      </label>
      <label className="block">
        <span className="text-[10px] uppercase tracking-widest text-brand-slate/70">Image URL</span>
        <input
          type="url"
          value={imageUrl}
          onChange={(e) => setImageUrl(e.target.value)}
          className="mt-0.5 w-full rounded-md border border-brand-slate/20 bg-white px-2 py-1.5 font-mono text-xs text-brand-ink placeholder:text-brand-slate/55"
        />
      </label>
      <label className="block">
        <span className="text-[10px] uppercase tracking-widest text-brand-slate/70">Scheduled at</span>
        <input
          type="datetime-local"
          value={scheduledAt}
          onChange={(e) => setScheduledAt(e.target.value)}
          className="mt-0.5 w-full rounded-md border border-brand-slate/20 bg-white px-2 py-1.5 text-sm text-brand-ink placeholder:text-brand-slate/55"
        />
      </label>
      <div className="flex items-center gap-2 pt-1">
        <button
          type="button"
          onClick={submit}
          disabled={busy}
          className="inline-flex items-center gap-1 rounded-full bg-brand-ink px-3 py-1 text-xs text-brand-cloud disabled:opacity-50"
        >
          <Save size={12} /> {busy ? 'Saving…' : 'Save changes'}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="inline-flex items-center gap-1 rounded-full border border-brand-ink/30 px-3 py-1 text-xs text-brand-ink"
        >
          <RotateCcw size={12} /> Cancel
        </button>
      </div>
    </div>
  );
}

function fmtScheduled(iso) {
  if (!iso) return 'unscheduled';
  const d = new Date(iso);
  return d.toLocaleString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

function shortTime(iso) {
  if (!iso) return '';
  return new Date(iso).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}
