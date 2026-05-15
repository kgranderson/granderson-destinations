-- =============================================================
-- Granderson Destinations — Marketing Manager schema migration
-- 2026-05-15
-- =============================================================
-- Wrap the whole migration in a single transaction so any failure
-- rolls everything back. Supabase's SQL editor honors the explicit
-- begin/commit pair AS LONG AS THE WHOLE FILE IS RUN IN ONE EXECUTION
-- (paste, then Run). Do NOT highlight-and-run pieces of this file
-- separately — partial selections lose the transaction context. Via
-- `supabase db push` or psql it's always atomic.
begin;

-- Adds the data model for the /admin/marketing module:
--   • Per-property Meta (Instagram + Facebook) credentials so each
--     property has its own social account, rather than the single
--     META_INSTAGRAM_BUSINESS_ID env var the legacy social engine used.
--   • marketing_campaigns: named, themed, multi-post marketing plays
--     (e.g. "Coachella 2026 launch") that tie a strategic objective
--     to a sequence of IG posts + email blasts.
--   • marketing_quarterly_plans: cached Perplexity synthesis per
--     property per quarter — significant events, comp-set ADR moves,
--     premium booking windows. Drives PriceLabs override pushes.
--   • marketing_email_campaigns: Resend-powered newsletters + drips.
--   • Extension to ig_posts: campaign linkage + approval gate so
--     posts go draft → pending → approved → published rather than
--     auto-publishing from the cadence engine.
--   • Extension to bookings: UTM attribution columns so we can
--     answer "which channel drove this booking?".
--
-- Idempotent: safe to re-run. All policies wrapped in
-- drop-if-exists; all columns use add-column-if-not-exists.
-- =============================================================

-- =============================================================
-- Per-property marketing credentials
-- =============================================================
-- One Instagram Business account + one Facebook Page per property.
-- Tokens are long-lived (60-day expiry) and refreshed by a cron job
-- before expiry. Stored as bcrypt-style at-rest by Supabase — for
-- defense in depth, encrypt with pgsodium in a follow-up.
alter table public.properties
  add column if not exists ig_business_id text,
  add column if not exists ig_access_token text,
  add column if not exists ig_token_expires_at timestamptz,
  add column if not exists fb_page_id text,
  add column if not exists meta_ad_account_id text,
  add column if not exists google_ads_customer_id text,
  add column if not exists resend_audience_id text,
  add column if not exists utm_source_tag text;

comment on column public.properties.ig_business_id is 'Instagram Business account ID (the /{ig-user-id}/ in Graph API URLs)';
comment on column public.properties.ig_access_token is 'Long-lived Meta Graph access token. Refresh ~50 days after issue.';
comment on column public.properties.utm_source_tag is 'e.g. "sunbath-house" — appended as utm_source to outbound IG + email links';

-- =============================================================
-- marketing_campaigns — named, themed, multi-post plays
-- =============================================================
create table if not exists public.marketing_campaigns (
  id uuid primary key default gen_random_uuid(),
  property_id uuid references public.properties(id) on delete cascade,
  name text not null,                                    -- "Coachella 2026 launch"
  objective text,                                        -- "drive bookings for W1 of Coachella"
  theme text,                                            -- "where to crash for the weekend"
  start_date date,
  end_date date,
  status text default 'draft' check (
    status in ('draft','active','paused','completed','archived')
  ),
  anchor_event_id uuid references public.anchor_events(id) on delete set null,
  target_post_count int default 8,
  goal_bookings int,
  notes text,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index if not exists campaigns_property_idx
  on public.marketing_campaigns(property_id, start_date desc);

alter table public.marketing_campaigns enable row level security;
drop policy if exists "marketing_campaigns_admin_all" on public.marketing_campaigns;
create policy "marketing_campaigns_admin_all"
  on public.marketing_campaigns for all
  using ( public.is_admin() )
  with check ( public.is_admin() );

-- =============================================================
-- marketing_quarterly_plans — Perplexity synthesis snapshots
-- =============================================================
-- Cache layer between the public /intel page (general weekly feed)
-- and the marketing manager's per-property quarterly view. Refreshed
-- on a cron + on-demand from the UI.
create table if not exists public.marketing_quarterly_plans (
  id uuid primary key default gen_random_uuid(),
  property_id uuid references public.properties(id) on delete cascade,
  year int not null,
  quarter int not null check (quarter between 1 and 4),
  intel_summary jsonb,           -- raw Perplexity output
  premium_windows jsonb,         -- [{start, end, label, recommended_adr_uplift_pct, source_event_id}]
  comp_set_snapshot jsonb,       -- AirDNA / Hospitable comp medians at time of generation
  generated_at timestamptz default now(),
  generated_by uuid references public.profiles(id) on delete set null,
  unique (property_id, year, quarter)
);

create index if not exists quarterly_plans_year_q_idx
  on public.marketing_quarterly_plans(year desc, quarter desc);

alter table public.marketing_quarterly_plans enable row level security;
drop policy if exists "quarterly_plans_admin_all" on public.marketing_quarterly_plans;
create policy "quarterly_plans_admin_all"
  on public.marketing_quarterly_plans for all
  using ( public.is_admin() )
  with check ( public.is_admin() );

-- =============================================================
-- marketing_email_campaigns — Resend-powered newsletter + drips
-- =============================================================
create table if not exists public.marketing_email_campaigns (
  id uuid primary key default gen_random_uuid(),
  property_id uuid references public.properties(id) on delete set null,  -- null = portfolio-wide
  campaign_id uuid references public.marketing_campaigns(id) on delete set null,
  subject text not null,
  preheader text,
  body_html text,
  body_text text,
  audience_segment text default 'past_guests' check (
    audience_segment in ('past_guests','waitlist','all_subscribers','custom')
  ),
  custom_audience_query jsonb,            -- when audience_segment='custom'
  scheduled_for timestamptz,
  resend_broadcast_id text,
  status text default 'draft' check (
    status in ('draft','scheduled','sent','failed','cancelled')
  ),
  sent_count int default 0,
  delivered_count int default 0,
  opened_count int default 0,
  clicked_count int default 0,
  bounced_count int default 0,
  unsubscribed_count int default 0,
  template text,                          -- 'pre_arrival' | 'post_stay' | 'win_back' | 'newsletter' | 'custom'
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index if not exists email_campaigns_status_scheduled_idx
  on public.marketing_email_campaigns(status, scheduled_for)
  where status in ('scheduled','draft');

alter table public.marketing_email_campaigns enable row level security;
drop policy if exists "email_campaigns_admin_all" on public.marketing_email_campaigns;
create policy "email_campaigns_admin_all"
  on public.marketing_email_campaigns for all
  using ( public.is_admin() )
  with check ( public.is_admin() );

-- =============================================================
-- ig_posts — campaign linkage + approval gate
-- =============================================================
-- The legacy ig_posts.status state machine handled "scheduled/queued/
-- published/failed" but offered no human-in-the-loop. Marketing
-- manager v1 adds an approval gate so the cadence engine generates
-- posts as approval_status='pending', the operator reviews/edits/
-- approves in /admin/marketing/[property]/approve, and only then
-- does the publish cron pick them up.
alter table public.ig_posts
  add column if not exists campaign_id uuid references public.marketing_campaigns(id) on delete set null,
  add column if not exists approval_status text default 'pending' check (
    approval_status in ('pending','approved','rejected','auto')
  ),
  add column if not exists approved_by uuid references public.profiles(id) on delete set null,
  add column if not exists approved_at timestamptz,
  add column if not exists rejection_reason text,
  add column if not exists hashtags text[] default '{}'::text[],
  add column if not exists theme text;

-- Backfill: any ig_posts row that existed BEFORE this migration was
-- created by the legacy cadence engine which had no approval concept.
-- The default 'pending' was applied to those rows by the add-column,
-- which means the Phase C publish cron would refuse to publish them.
-- Mark all pre-existing rows as 'auto' so the legacy flow keeps
-- working until you explicitly opt them into the approval workflow.
--
-- HARD CUTOFF: only flip rows created BEFORE this migration date.
-- Without the cutoff, re-running the migration could silently flip
-- legitimate future pending posts (generated by the Phase C cadence
-- engine) to 'auto', bypassing the approval gate entirely.
update public.ig_posts
   set approval_status = 'auto'
 where approval_status = 'pending'
   and approved_at is null
   and created_at is not null
   and created_at < '2026-05-15 00:00:00+00'::timestamptz;

create index if not exists ig_posts_approval_idx
  on public.ig_posts(approval_status, scheduled_at)
  where approval_status in ('pending','approved');

-- =============================================================
-- bookings — UTM attribution
-- =============================================================
-- Outbound links from IG, email campaigns, and paid ads are stamped
-- with utm_source / utm_medium / utm_campaign. When a guest clicks
-- through and books, the booking-creation endpoint captures these
-- so the marketing dashboard can compute cost-per-booking per
-- channel.
alter table public.bookings
  add column if not exists utm_source text,
  add column if not exists utm_medium text,
  add column if not exists utm_campaign text,
  add column if not exists utm_content text,
  add column if not exists utm_term text,
  add column if not exists referrer_url text;

create index if not exists bookings_utm_source_idx
  on public.bookings(utm_source)
  where utm_source is not null;

-- =============================================================
-- Post-migration assertion
-- =============================================================
-- Fail loudly if anything didn't land. Helpful for catching partial
-- application when a transaction is rolled back mid-run.
do $$
begin
  -- Each of the three new tables
  if not exists (
    select 1 from information_schema.tables
    where table_schema = 'public' and table_name = 'marketing_campaigns'
  ) then
    raise exception 'marketing_campaigns table missing after migration';
  end if;
  if not exists (
    select 1 from information_schema.tables
    where table_schema = 'public' and table_name = 'marketing_quarterly_plans'
  ) then
    raise exception 'marketing_quarterly_plans table missing after migration';
  end if;
  if not exists (
    select 1 from information_schema.tables
    where table_schema = 'public' and table_name = 'marketing_email_campaigns'
  ) then
    raise exception 'marketing_email_campaigns table missing after migration';
  end if;

  -- One column from each table extension
  if not exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'properties' and column_name = 'ig_business_id'
  ) then
    raise exception 'properties.ig_business_id column missing after migration';
  end if;
  if not exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'ig_posts' and column_name = 'approval_status'
  ) then
    raise exception 'ig_posts.approval_status column missing after migration';
  end if;
  if not exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'bookings' and column_name = 'utm_source'
  ) then
    raise exception 'bookings.utm_source column missing after migration';
  end if;

  -- Confirm the is_admin() helper used by RLS policies actually exists
  if not exists (
    select 1 from pg_proc p
    join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public' and p.proname = 'is_admin'
  ) then
    raise exception 'public.is_admin() helper missing — run supabase/schema.sql first';
  end if;

  -- Confirm RLS is enabled on all new tables
  if exists (
    select 1 from pg_tables
    where schemaname = 'public'
      and tablename in ('marketing_campaigns','marketing_quarterly_plans','marketing_email_campaigns')
      and rowsecurity = false
  ) then
    raise exception 'RLS not enabled on one of the new marketing_* tables';
  end if;
end $$;

commit;
