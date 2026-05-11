-- =============================================================
-- Migration: M7b admin hub (occupancy + maintenance)
-- Run once in Supabase SQL Editor against the existing project.
-- Safe to re-run (idempotent — uses IF NOT EXISTS / IF EXISTS).
-- =============================================================

create table if not exists public.occupancy_records (
  id uuid primary key default gen_random_uuid(),
  property_id uuid references public.properties(id) on delete cascade,
  month text not null,
  nights_booked int default 0,
  nights_available int default 0,
  adr_realized numeric,
  revenue_realized numeric,
  source text default 'manual',
  created_at timestamptz default now()
);

create unique index if not exists occupancy_property_month_idx
  on public.occupancy_records(property_id, month);

alter table public.occupancy_records enable row level security;

drop policy if exists "occupancy_admin_read" on public.occupancy_records;
create policy "occupancy_admin_read"
  on public.occupancy_records for select
  using (exists (select 1 from public.profiles p
                 where p.id = auth.uid() and p.tier = 'admin'));

drop policy if exists "occupancy_admin_write" on public.occupancy_records;
create policy "occupancy_admin_write"
  on public.occupancy_records for all
  using (exists (select 1 from public.profiles p
                 where p.id = auth.uid() and p.tier = 'admin'))
  with check (exists (select 1 from public.profiles p
                      where p.id = auth.uid() and p.tier = 'admin'));

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
  category text,
  reporter_email text,
  vendor_assigned text,
  vendor_contact text,
  estimated_cost numeric,
  actual_cost numeric,
  scheduled_for date,
  resolved_at timestamptz,
  clickup_task_id text,
  notes text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index if not exists maint_property_idx on public.maintenance_requests(property_id, status);
create index if not exists maint_status_idx on public.maintenance_requests(status, priority);

alter table public.maintenance_requests enable row level security;

drop policy if exists "maint_admin_read" on public.maintenance_requests;
create policy "maint_admin_read"
  on public.maintenance_requests for select
  using (exists (select 1 from public.profiles p
                 where p.id = auth.uid() and p.tier = 'admin'));

drop policy if exists "maint_admin_write" on public.maintenance_requests;
create policy "maint_admin_write"
  on public.maintenance_requests for all
  using (exists (select 1 from public.profiles p
                 where p.id = auth.uid() and p.tier = 'admin'))
  with check (exists (select 1 from public.profiles p
                      where p.id = auth.uid() and p.tier = 'admin'));
