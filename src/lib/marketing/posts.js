import 'server-only';
/**
 * IG post lifecycle helpers for the approval queue.
 *
 * The publish cron (/api/social/publish) only acts on rows where
 * approval_status IN ('approved','auto') AND scheduled_at <= now()
 * AND status='scheduled'. So the operator's job in /admin/marketing/
 * [property]/approve is to flip pending rows to approved (or reject).
 */
import { getAdminClient } from '@/lib/supabase/admin';

/**
 * Pending posts across all campaigns for a property, ordered by
 * scheduled_at ascending (oldest pending first). Joins to the
 * campaign for context.
 */
export async function listPendingPosts({ propertySlug, includeApproved = false, limit = 100 }) {
  const supabase = getAdminClient();
  if (!supabase) return [];

  const { data: prop } = await supabase
    .from('properties')
    .select('id')
    .eq('slug', propertySlug)
    .maybeSingle();
  if (!prop?.id) return [];

  const filters = includeApproved
    ? ['pending', 'approved']
    : ['pending'];

  const { data, error } = await supabase
    .from('ig_posts')
    .select(
      `
      id, scheduled_at, image_url, caption, hashtags, theme,
      status, approval_status, approved_by, approved_at, rejection_reason,
      campaign_id, external_id, failure_reason,
      campaign:marketing_campaigns(id, name, theme)
      `,
    )
    .eq('property_id', prop.id)
    .in('approval_status', filters)
    .order('scheduled_at', { ascending: true })
    .limit(limit);

  if (error || !data) return [];
  return data;
}

/**
 * Approve a post for publishing. Returns the updated row.
 */
export async function approvePost({ id, approvedBy }) {
  const supabase = getAdminClient();
  if (!supabase) throw new Error('storage not configured');

  const { data, error } = await supabase
    .from('ig_posts')
    .update({
      approval_status: 'approved',
      approved_by: approvedBy || null,
      approved_at: new Date().toISOString(),
      rejection_reason: null,
    })
    .eq('id', id)
    .eq('approval_status', 'pending')   // guard: don't downgrade rejected/auto
    .select('*')
    .maybeSingle();

  if (error) throw new Error(`approve failed: ${error.message}`);
  if (data) return data;

  // Zero rows updated → either the post doesn't exist OR it's already
  // in a non-pending state. Make the operation idempotent: if the post
  // is ALREADY approved (operator double-clicked the button before the
  // optimistic-remove fired), return success with the existing row
  // instead of throwing. Otherwise the queue UI would resurrect the
  // card on the second click and confuse the operator.
  const { data: existing, error: lookupErr } = await supabase
    .from('ig_posts')
    .select('*')
    .eq('id', id)
    .maybeSingle();
  if (lookupErr) throw new Error(`approve failed: ${lookupErr.message}`);
  if (!existing) throw new Error('post not found');
  if (existing.approval_status === 'approved') return existing; // idempotent
  throw new Error(
    `post is in '${existing.approval_status}' state — cannot approve from here`,
  );
}

/**
 * Reject a post — it won't be published. Operator can pass a reason
 * which gets stored for audit + later filtering.
 */
export async function rejectPost({ id, reason }) {
  const supabase = getAdminClient();
  if (!supabase) throw new Error('storage not configured');

  const { data, error } = await supabase
    .from('ig_posts')
    .update({
      approval_status: 'rejected',
      rejection_reason: reason ? String(reason).slice(0, 500) : null,
      approved_at: null,
      approved_by: null,
    })
    .eq('id', id)
    .select('*')
    .single();

  if (error) throw new Error(`reject failed: ${error.message}`);
  return data;
}

/**
 * Update draft fields the operator can edit before approving:
 * caption, scheduled_at, image_url, hashtags. Status / approval_status
 * are NOT editable via this endpoint — use approvePost/rejectPost.
 */
export async function updatePostDraft({ id, fields }) {
  const supabase = getAdminClient();
  if (!supabase) throw new Error('storage not configured');

  const update = {};
  if (typeof fields.caption === 'string') update.caption = fields.caption.slice(0, 2200);
  if (typeof fields.image_url === 'string') update.image_url = fields.image_url.slice(0, 1000);
  if (typeof fields.scheduled_at === 'string') {
    if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/.test(fields.scheduled_at)) {
      throw new Error('scheduled_at must be ISO datetime');
    }
    update.scheduled_at = fields.scheduled_at;
  }
  if (Array.isArray(fields.hashtags)) {
    update.hashtags = fields.hashtags
      .map((t) => String(t).trim())
      .filter((t) => t.length > 0 && t.length < 100)
      .slice(0, 30);
  }
  if (typeof fields.theme === 'string') update.theme = fields.theme.slice(0, 60);

  if (Object.keys(update).length === 0) {
    throw new Error('no editable fields supplied');
  }

  const { data, error } = await supabase
    .from('ig_posts')
    .update(update)
    .eq('id', id)
    .select('*')
    .single();

  if (error) throw new Error(`update failed: ${error.message}`);
  return data;
}
