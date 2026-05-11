-- =============================================================
-- Granderson Destinations — Supabase schema
-- v2.0 (Scholarship-Winner-pattern rebuild)
-- =============================================================
-- Run with: supabase db push

create extension if not exists "pgcrypto";

-- =============================================================
-- profiles — extends auth.users
-- =============================================================
create table if not exists public.profiles (
  id uuid primary key references auth.users on delete cascade,
  email text unique,
  full_name text,
  avatar_url text,
  phone text,
  tier text default 'guest' check (tier in ('guest', 'member', 'admin')),
  stripe_customer_id text,
  onboarding_completed boolean default false,
  preferred_markets text[] default '{}',
  loyalty_points int default 0,
  total_nights int default 0,
  total_stays int default 0,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.profiles enable row level security;

create policy "profiles_self_read"
  on public.profiles for select
  using (auth.uid() = id);

create policy "profiles_self_update"
  on public.profiles for update
  using (auth.uid() = id);

-- =============================================================
-- properties
-- =============================================================
create table if not exists public.properties (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  name text not null,
  short_name text,
  market text not null,             -- 'palm-springs' | 'san-miguel-de-allende' | ...
  city text not null,
  region text,
  country text,
  address_line text,
  lat numeric,
  lng numeric,
  accent text default 'gold',
  bedrooms int,
  bathrooms numeric,
  sleeps int,
  size_sqft int,
  hero_image text,
  gallery jsonb default '[]'::jsonb,
  tagline text,
  description text,
  amenities text[] default '{}',
  base_adr_usd numeric,
  pricelabs_listing_id text,
  airbnb_listing_id text,
  vrbo_listing_id text,
  airdna_market_code text,
  is_active boolean default true,
  is_primary boolean default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index if not exists properties_market_idx on public.properties(market);
create index if not exists properties_slug_idx on public.properties(slug);

-- Public read of active properties.
alter table public.properties enable row level security;
create policy "properties_public_read"
  on public.properties for select
  using (is_active = true);

-- =============================================================
-- bookings (Stripe-deposit-backed)
-- =============================================================
create table if not exists public.bookings (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete set null,
  property_id uuid references public.properties(id),
  start_date date not null,
  end_date date not null,
  nights int generated always as (end_date - start_date) stored,
  guest_count int not null default 2,
  total_usd numeric not null,
  deposit_usd numeric not null,
  status text default 'pending' check (
    status in ('pending', 'confirmed', 'cancelled', 'completed')
  ),
  stripe_payment_intent_id text,
  notes text,
  created_at timestamptz default now()
);

create index if not exists bookings_user_idx on public.bookings(user_id);
create index if not exists bookings_property_idx on public.bookings(property_id);
create index if not exists bookings_date_idx on public.bookings(start_date, end_date);

alter table public.bookings enable row level security;
create policy "bookings_self_read"
  on public.bookings for select
  using (auth.uid() = user_id);
create policy "bookings_self_insert"
  on public.bookings for insert
  with check (auth.uid() = user_id);
create policy "bookings_self_update"
  on public.bookings for update
  using (auth.uid() = user_id and status in ('pending'));

-- =============================================================
-- stripe_events — webhook idempotency table
-- =============================================================
create table if not exists public.stripe_events (
  id text primary key,             -- the Stripe event id
  type text,
  processed_at timestamptz default now()
);

-- =============================================================
-- intel_items — Feature 1 city-council / entitlement feed
-- =============================================================
create table if not exists public.intel_items (
  id uuid primary key default gen_random_uuid(),
  market text not null,
  title text not null,
  category text,
  expected_impact text check (expected_impact in ('positive', 'negative', 'mixed')),
  magnitude text check (magnitude in ('low', 'medium', 'high')),
  earliest_date text,
  latest_date text,
  summary text,
  revenue_thesis text,
  source_title text,
  source_url text,
  fetched_at timestamptz default now()
);

create index if not exists intel_market_idx on public.intel_items(market);

alter table public.intel_items enable row level security;
create policy "intel_public_read" on public.intel_items for select using (true);

-- =============================================================
-- hotspots — Feature 2 restaurants & activities
-- =============================================================
create table if not exists public.hotspots (
  id uuid primary key default gen_random_uuid(),
  market text not null,
  category text check (category in (
    'restaurant', 'cocktail-bar', 'cafe', 'museum', 'gallery',
    'spa', 'shop', 'hike', 'tour', 'experience', 'nightlife'
  )),
  name text not null,
  description text,
  price_level int,
  rating numeric,
  google_place_id text,
  image_urls text[] default '{}',
  lat numeric,
  lng numeric,
  address text,
  website text,
  featured boolean default false,
  fetched_at timestamptz default now()
);

create index if not exists hotspots_market_idx on public.hotspots(market);

alter table public.hotspots enable row level security;
create policy "hotspots_public_read" on public.hotspots for select using (true);

-- =============================================================
-- anchor_events — Feature 3 event premium calendar
-- =============================================================
create table if not exists public.anchor_events (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  market text not null,
  name text not null,
  start_date date not null,
  end_date date not null,
  adr_uplift_pct numeric not null default 1.0,
  occupancy_uplift_pct numeric not null default 0,
  min_stay_nights int default 2,
  notes text,
  image text
);

create index if not exists anchor_events_market_idx on public.anchor_events(market);
alter table public.anchor_events enable row level security;
create policy "events_public_read" on public.anchor_events for select using (true);

-- =============================================================
-- monthly_financials — Feature 6 economics model
-- =============================================================
create table if not exists public.monthly_financials (
  id uuid primary key default gen_random_uuid(),
  property_id uuid references public.properties(id) on delete cascade,
  month text not null,                  -- YYYY-MM
  revenue numeric default 0,
  expense numeric default 0,
  expense_category text,
  source text default 'manual',         -- 'pricelabs' | 'stripe' | 'manual' | 'qbo'
  created_at timestamptz default now()
);

create index if not exists fin_property_month_idx
  on public.monthly_financials(property_id, month);

alter table public.monthly_financials enable row level security;
create policy "fin_admin_only_read"
  on public.monthly_financials for select
  using (exists (select 1 from public.profiles p
                 where p.id = auth.uid() and p.tier = 'admin'));
create policy "fin_admin_only_write"
  on public.monthly_financials for all
  using (exists (select 1 from public.profiles p
                 where p.id = auth.uid() and p.tier = 'admin'))
  with check (exists (select 1 from public.profiles p
                      where p.id = auth.uid() and p.tier = 'admin'));

-- =============================================================
-- ig_posts — Feature 4 social cadence scheduler
-- =============================================================
create table if not exists public.ig_posts (
  id uuid primary key default gen_random_uuid(),
  property_id uuid references public.properties(id),
  scheduled_at timestamptz not null,
  image_url text not null,
  caption text,
  location_id text,
  status text default 'scheduled' check (
    status in ('scheduled', 'queued', 'published', 'failed')
  ),
  external_id text,
  failure_reason text,
  published_at timestamptz
);

create index if not exists ig_property_idx on public.ig_posts(property_id, scheduled_at);

alter table public.ig_posts enable row level security;
create policy "ig_admin_only"
  on public.ig_posts for select
  using (exists (select 1 from public.profiles p
                 where p.id = auth.uid() and p.tier = 'admin'));

-- =============================================================
-- occupancy_records — Hospitable / manual occupancy data
-- =============================================================
create table if not exists public.occupancy_records (
  id uuid primary key default gen_random_uuid(),
  property_id uuid references public.properties(id) on delete cascade,
  month text not null,                       -- YYYY-MM
  nights_booked int default 0,
  nights_available int default 0,
  adr_realized numeric,
  revenue_realized numeric,
  source text default 'manual',              -- 'hospitable' | 'manual' | 'airbnb-csv' | 'vrbo-csv'
  created_at timestamptz default now()
);

create unique index if not exists occupancy_property_month_idx
  on public.occupancy_records(property_id, month);

alter table public.occupancy_records enable row level security;
create policy "occupancy_admin_read"
  on public.occupancy_records for select
  using (exists (select 1 from public.profiles p
                 where p.id = auth.uid() and p.tier = 'admin'));
create policy "occupancy_admin_write"
  on public.occupancy_records for all
  using (exists (select 1 from public.profiles p
                 where p.id = auth.uid() and p.tier = 'admin'))
  with check (exists (select 1 from public.profiles p
                      where p.id = auth.uid() and p.tier = 'admin'));

-- =============================================================
-- maintenance_requests — admin-managed ops tickets
-- =============================================================
create table if not exists public.maintenance_requests (
  id uuid primary key default gen_random_uuid(),
  property_id uuid references public.properties(id) on delete cascade,
  title text not null,
  description text,
  status text default 'open' check (
    status in ('open', 'in_progress', 'scheduled', 'completed', 'cancelled')
  ),
  priority text default 'normal' check (
    priority in ('low', 'normal', 'high', 'urgent')
  ),
  category text,                              -- 'plumbing'|'electrical'|'hvac'|'pool'|'landscape'|'appliance'|'general'
  reporter_email text,
  vendor_assigned text,
  vendor_contact text,
  estimated_cost numeric,
  actual_cost numeric,
  scheduled_for date,
  resolved_at timestamptz,
  clickup_task_id text,                       -- when ClickUp sync wires up
  notes text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index if not exists maint_property_idx on public.maintenance_requests(property_id, status);
create index if not exists maint_status_idx on public.maintenance_requests(status, priority);

alter table public.maintenance_requests enable row level security;
create policy "maint_admin_read"
  on public.maintenance_requests for select
  using (exists (select 1 from public.profiles p
                 where p.id = auth.uid() and p.tier = 'admin'));
create policy "maint_admin_write"
  on public.maintenance_requests for all
  using (exists (select 1 from public.profiles p
                 where p.id = auth.uid() and p.tier = 'admin'))
  with check (exists (select 1 from public.profiles p
                      where p.id = auth.uid() and p.tier = 'admin'));

-- =============================================================
-- profile auto-creation trigger
-- =============================================================
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name)
  values (new.id, new.email, coalesce(new.raw_user_meta_data->>'full_name', new.email))
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
