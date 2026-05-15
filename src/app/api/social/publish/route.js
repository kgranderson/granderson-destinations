import { NextResponse } from 'next/server';
import { withCronAuth } from '@/lib/auth/cron';
import { getAdminClient } from '@/lib/supabase/admin';
import { publishImage } from '@/lib/social/instagram';

/**
 * Hourly publish cron — picks up ig_posts whose scheduled_at has
 * passed and that the operator has approved (or marked 'auto' for
 * the legacy non-approval flow). Each post is published with its
 * property's per-property Meta credentials when available; falls
 * back to env vars otherwise (mixed-state portfolios).
 *
 * Rows where creds are missing OR the feature flag is off get marked
 * 'queued' (with a stub external_id) so they show up in the dashboard
 * as "would have published if creds were live."
 *
 * Failures are caught per-row — one broken post doesn't take the
 * whole batch down. The row flips to 'failed' with a truncated
 * failure_reason for the operator to debug.
 *
 * Concurrency: scheduled hourly. We cap the batch at 50/run, which
 * comfortably covers the IG API rate limit (200 calls/hour/account)
 * across the portfolio.
 */
export const POST = withCronAuth(async () => {
  const supabase = getAdminClient();
  if (!supabase) {
    return NextResponse.json({ ok: false, error: 'storage not configured' }, { status: 503 });
  }

  const nowIso = new Date().toISOString();

  const { data: posts, error } = await supabase
    .from('ig_posts')
    .select(
      `
      id, scheduled_at, image_url, caption, hashtags, location_id, status,
      approval_status, property_id, campaign_id,
      property:properties(id, slug, ig_business_id, ig_access_token, ig_token_expires_at)
      `,
    )
    .in('approval_status', ['approved', 'auto'])
    .eq('status', 'scheduled')
    .lte('scheduled_at', nowIso)
    .limit(50);

  if (error) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }

  const results = [];
  for (const post of posts || []) {
    try {
      // Compose the full caption with hashtags appended (IG style)
      const tags = Array.isArray(post.hashtags) ? post.hashtags.join(' ') : '';
      const fullCaption = tags ? `${post.caption || ''}\n\n${tags}`.trim() : (post.caption || '');

      const res = await publishImage({
        imageUrl: post.image_url,
        caption: fullCaption,
        locationId: post.location_id,
        igBusinessId: post.property?.ig_business_id,
        accessToken: post.property?.ig_access_token,
      });

      if (res.stub) {
        // CRITICAL: leave status='scheduled' so future cron runs re-pick
        // this post once Meta creds are saved on the property. Setting
        // status='queued' or 'published' here would orphan the post in a
        // terminal state — when creds land later, the post never publishes.
        // We DON'T persist the stub external_id; record it only in the
        // cron response for ops visibility.
        results.push({ id: post.id, stub: true, externalId: res.id });
      } else {
        await supabase
          .from('ig_posts')
          .update({
            status: 'published',
            external_id: res.id,
            published_at: new Date().toISOString(),
          })
          .eq('id', post.id);
        results.push({ id: post.id, published: true, externalId: res.id });
      }
    } catch (err) {
      // Belt-and-suspenders: Meta error responses generally don't echo
      // the access_token, but if they ever did (or if a future error
      // path interpolates it), we'd be persisting it in plaintext to
      // failure_reason. Pre-emptively scrub the token from any error
      // string before it lands in the database.
      const token = post.property?.ig_access_token;
      const raw = String(err?.message || err);
      const scrubbed = token
        ? raw.split(token).join('••••<redacted>')
        : raw;
      const reason = scrubbed.slice(0, 500);
      await supabase
        .from('ig_posts')
        .update({
          status: 'failed',
          failure_reason: reason,
        })
        .eq('id', post.id);
      results.push({ id: post.id, failed: true, reason });
    }
  }

  return NextResponse.json({
    ok: true,
    at: nowIso,
    processed: results.length,
    published: results.filter((r) => r.published).length,
    stub: results.filter((r) => r.stub).length,
    failed: results.filter((r) => r.failed).length,
    results,
  });
});

// Keep GET as alias for manual ops debugging via curl
export const GET = POST;
