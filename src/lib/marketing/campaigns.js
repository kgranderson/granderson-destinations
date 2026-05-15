import 'server-only';
/**
 * Campaign lifecycle — create a named, themed marketing play that
 * generates N draft IG posts spaced across a date window. Drafts
 * land in ig_posts with approval_status='pending' so the operator
 * reviews each one in /admin/marketing/[property]/approve before
 * the publish cron picks them up.
 *
 * Draft generation flow:
 *   1. Spread targetPostCount posts evenly across start_date..end_date
 *      on the same day-of-week pattern the cadence engine uses
 *      (Tue/Thu/Sat, 6 PM local). If targetPostCount > available
 *      slots, fall back to one post per slot.
 *   2. For each draft slot, pick a photo from the property's photo
 *      library (round-robin so the campaign has visual variety).
 *   3. Generate a caption with the property + theme via the existing
 *      Claude caption helper. Caption gen runs server-side so the
 *      drafts land already-written; operator only edits if they want.
 *   4. Look up hashtags from the per-market bank for the theme.
 *   5. Insert all drafts in one batch into ig_posts with campaign_id
 *      pointing at the new campaign.
 */
import { format, addDays, parseISO } from 'date-fns';
import { getAdminClient } from '@/lib/supabase/admin';
import { generateCaption } from '@/lib/ai/claude';
import { buildHashtags } from '@/lib/social/hashtags';
import { listPhotosForProperty } from '@/lib/social/photo-library';
import { PROPERTIES, ANCHOR_EVENTS_SEED } from '@/lib/constants';

const POSTING_DAYS = [2, 4, 6]; // Tue / Thu / Sat
const POSTING_HOUR = 18;        // 6pm local

/**
 * Create a campaign and its draft posts. Returns
 *   { campaign, posts: [...], stub? }.
 *
 * @param input.propertySlug   string — must match a PROPERTIES entry
 * @param input.name           string — e.g. "Coachella 2026 launch"
 * @param input.objective      string — strategic objective (optional)
 * @param input.theme          string — caption / photo-library theme
 *                             (defaults to 'lifestyle')
 * @param input.anchorEventSlug string|null
 * @param input.startDate      ISO YYYY-MM-DD
 * @param input.endDate        ISO YYYY-MM-DD (must be > startDate)
 * @param input.targetPostCount int (default 8)
 * @param input.goalBookings   int (optional)
 * @param input.notes          string (optional)
 * @param input.createdBy      uuid|null — auth.user.id of the operator
 */
export async function createCampaign(input) {
  const supabase = getAdminClient();
  if (!supabase) throw new Error('storage not configured');

  const property = PROPERTIES.find((p) => p.slug === input.propertySlug);
  if (!property) throw new Error('unknown property');

  // Hydrate property.id from Supabase (PROPERTIES const lacks UUID)
  const { data: propRow } = await supabase
    .from('properties')
    .select('id')
    .eq('slug', property.slug)
    .maybeSingle();
  if (!propRow?.id) {
    throw new Error(`property ${property.slug} not found in DB — re-seed properties`);
  }

  // Anchor event lookup (optional)
  let anchorEvent = null;
  if (input.anchorEventSlug) {
    anchorEvent = ANCHOR_EVENTS_SEED.find((e) => e.slug === input.anchorEventSlug) || null;
  }

  // Validate dates
  const startIso = input.startDate;
  const endIso = input.endDate;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(startIso) || !/^\d{4}-\d{2}-\d{2}$/.test(endIso)) {
    throw new Error('startDate / endDate must be YYYY-MM-DD');
  }
  if (endIso <= startIso) throw new Error('endDate must be after startDate');

  const targetPostCount = Math.max(1, Math.min(50, Number(input.targetPostCount) || 8));
  const theme = String(input.theme || 'lifestyle').slice(0, 60);

  // Insert the campaign row first so drafts can reference it
  const { data: campaign, error: campErr } = await supabase
    .from('marketing_campaigns')
    .insert({
      property_id: propRow.id,
      name: String(input.name || '').slice(0, 200),
      objective: input.objective ? String(input.objective).slice(0, 500) : null,
      theme,
      start_date: startIso,
      end_date: endIso,
      status: 'active',
      anchor_event_id: null, // anchor_events table not yet wired by slug → uuid; left null
      target_post_count: targetPostCount,
      goal_bookings: input.goalBookings ? Number(input.goalBookings) : null,
      notes: input.notes ? String(input.notes).slice(0, 2000) : null,
      created_by: input.createdBy || null,
    })
    .select('*')
    .single();

  if (campErr) throw new Error(`failed to create campaign: ${campErr.message}`);

  // Compute the schedule slots — Tue/Thu/Sat at 6pm between start..end
  const slots = computeCampaignSlots({
    startIso,
    endIso,
    targetPostCount,
    anchorEvent,
  });

  // Generate drafts (caption + hashtags + photo per slot). Each draft
  // is independent so we can parallelize, but cap at 4 concurrent to
  // stay within Anthropic / our rate limits.
  const photos = listPhotosForProperty(property.slug);
  const drafts = [];
  for (let i = 0; i < slots.length; i += 4) {
    const batch = slots.slice(i, i + 4).map(async (slot, j) => {
      const photo = photos.length > 0 ? photos[(i + j) % photos.length] : null;
      // Per-post theme: alternate between campaign theme and photo's
      // suggested theme for visual + textual variety
      const postTheme = j % 2 === 0 ? theme : photo?.suggestedTheme || theme;
      let caption = '';
      try {
        const res = await generateCaption({ property, theme: postTheme });
        caption = (res.caption || '').replace(/\n*#[^\n]*$/m, '').trim();
      } catch {
        caption = `${property.shortName} — ${postTheme}.`; // fallback if Claude fails
      }
      const hashtags = buildHashtags({ market: property.slug, theme: postTheme });
      return {
        property_id: propRow.id,
        campaign_id: campaign.id,
        scheduled_at: slot.scheduledAt,
        image_url: photo?.src || '',
        caption,
        hashtags,
        theme: postTheme,
        status: 'scheduled',
        approval_status: 'pending',
      };
    });
    drafts.push(...(await Promise.all(batch)));
  }

  // Bulk insert drafts
  const { data: posts, error: postsErr } = await supabase
    .from('ig_posts')
    .insert(drafts)
    .select('*');

  if (postsErr) {
    // Rollback the campaign so we don't leave an orphan
    await supabase.from('marketing_campaigns').delete().eq('id', campaign.id);
    throw new Error(`failed to create drafts: ${postsErr.message}`);
  }

  return { campaign, posts };
}

/**
 * List campaigns for a property, newest first.
 */
export async function listCampaigns({ propertySlug }) {
  const supabase = getAdminClient();
  if (!supabase) return [];

  const { data: prop } = await supabase
    .from('properties')
    .select('id')
    .eq('slug', propertySlug)
    .maybeSingle();
  if (!prop?.id) return [];

  const { data, error } = await supabase
    .from('marketing_campaigns')
    .select('id, name, objective, theme, start_date, end_date, status, target_post_count, goal_bookings, created_at')
    .eq('property_id', prop.id)
    .order('created_at', { ascending: false });

  if (error || !data) return [];

  // Annotate each campaign with post counts so the list view can show
  // "12 posts · 3 pending · 9 approved" at a glance
  const enriched = await Promise.all(
    data.map(async (c) => {
      const { data: counts } = await supabase
        .from('ig_posts')
        .select('approval_status', { count: 'exact' })
        .eq('campaign_id', c.id);
      const byStatus = (counts || []).reduce(
        (acc, r) => {
          acc.total++;
          acc[r.approval_status] = (acc[r.approval_status] || 0) + 1;
          return acc;
        },
        { total: 0 },
      );
      return { ...c, counts: byStatus };
    }),
  );
  return enriched;
}

// =========================================================
// Internals
// =========================================================

/**
 * Compute the scheduled slots for a campaign. Strategy:
 *  - List every Tue/Thu/Sat at 18:00 local between start and end (inclusive).
 *  - If we have more slots than targetPostCount, evenly sample to hit count.
 *  - If we have fewer slots than targetPostCount, post on every slot and
 *    let the operator decide whether to extend the campaign.
 *  - If anchorEvent is provided, ensure a post lands 21d, 14d, 7d, 1d
 *    before the event (replacing the nearest cadence slot).
 */
function computeCampaignSlots({ startIso, endIso, targetPostCount, anchorEvent }) {
  const start = parseISO(startIso);
  const end = parseISO(endIso);
  const allSlots = [];

  for (let d = start; d <= end; d = addDays(d, 1)) {
    if (POSTING_DAYS.includes(d.getDay())) {
      const slot = new Date(d);
      slot.setHours(POSTING_HOUR, 0, 0, 0);
      allSlots.push({ scheduledAt: format(slot, "yyyy-MM-dd'T'HH:mm:ssXXX") });
    }
  }

  // Even sample if we have too many slots
  let picked = allSlots;
  if (allSlots.length > targetPostCount) {
    const step = allSlots.length / targetPostCount;
    picked = Array.from({ length: targetPostCount }, (_, i) => allSlots[Math.floor(i * step)]);
  }

  // Event-anchored slots (override at lead days)
  if (anchorEvent) {
    const eventStart = parseISO(anchorEvent.startDate);
    for (const lead of [21, 14, 7, 1]) {
      const at = addDays(eventStart, -lead);
      if (at >= start && at <= end) {
        const slot = new Date(at);
        slot.setHours(POSTING_HOUR, 0, 0, 0);
        const iso = format(slot, "yyyy-MM-dd'T'HH:mm:ssXXX");
        // Replace nearest picked slot, or append
        if (!picked.some((s) => s.scheduledAt.slice(0, 10) === iso.slice(0, 10))) {
          picked.push({ scheduledAt: iso, kind: 'event-lead', leadDays: lead });
        }
      }
    }
  }

  // Sort chronologically (event-anchored may have appended)
  return picked.sort((a, b) => a.scheduledAt.localeCompare(b.scheduledAt));
}
