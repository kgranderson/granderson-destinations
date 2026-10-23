begin;

-- A self-update policy cannot protect individual privilege-bearing columns.
revoke update on public.profiles from public, anon, authenticated;
grant update (full_name, avatar_url, phone, onboarding_completed, preferred_markets) on public.profiles to authenticated;
drop policy if exists profiles_self_update on public.profiles;
create policy profiles_self_update on public.profiles for update to authenticated using ((select auth.uid()) = id) with check ((select auth.uid()) = id);
revoke execute on function public.handle_new_user() from public, anon, authenticated;

-- Public property rows must never hold provider secrets. Preserve configured values privately.
create table if not exists public.property_integrations (
  property_id uuid primary key references public.properties(id) on delete cascade,
  ig_business_id text, ig_access_token text, ig_token_expires_at timestamptz,
  fb_page_id text, meta_ad_account_id text
);
alter table public.property_integrations enable row level security;
revoke all on public.property_integrations from public, anon, authenticated;
grant all on public.property_integrations to service_role;
insert into public.property_integrations (property_id,ig_business_id,ig_access_token,ig_token_expires_at,fb_page_id,meta_ad_account_id)
select id,ig_business_id,ig_access_token,ig_token_expires_at,fb_page_id,meta_ad_account_id from public.properties where ig_access_token is not null
on conflict (property_id) do nothing;
update public.properties set ig_access_token = null where ig_access_token is not null;
-- Fail closed if an older deployment attempts to store a token publicly.
alter table public.properties add constraint no_public_provider_token check (ig_access_token is null);

create table public.gd_job_leases (id text primary key, started_at timestamptz not null);
create table public.key_check_runs (
  id uuid primary key default gen_random_uuid(), started_at timestamptz not null default now(),
  deployment_id text, healthy boolean not null, counts jsonb not null, results jsonb not null
);
create index key_check_runs_latest on public.key_check_runs(started_at desc);
create table public.key_check_state (id integer primary key check(id=1), fingerprint text, notified_day date);
insert into public.key_check_state(id) values (1);
create table public.key_check_notices (
  id text primary key, payload jsonb not null, created_at timestamptz not null default now(), sent_at timestamptz
);
create table public.admin_audit_events (
  id bigint generated always as identity primary key, occurred_at timestamptz not null default now(),
  action text not null, actor_id uuid, auth_method text not null
);
create table public.property_benchmarks (
  property_slug text primary key, provider text not null check(provider in ('airdna','manual')),
  fetched_at timestamptz not null default now(), payload jsonb not null
);
create table public.property_analysis_runs (
  id uuid primary key default gen_random_uuid(), property_slug text not null,
  created_at timestamptz not null default now(), report jsonb not null
);
create index property_analysis_latest on public.property_analysis_runs(property_slug,created_at desc);
create table public.property_optimization_actions (
  property_slug text not null, action_id text not null,
  status text not null check(status in ('planned','testing','done','dismissed')),
  updated_at timestamptz not null default now(), primary key(property_slug,action_id)
);
-- The server authenticates every operator before using these private tables.
do $$ declare t text; begin
  foreach t in array array['gd_job_leases','key_check_runs','key_check_state','key_check_notices','admin_audit_events','property_benchmarks','property_analysis_runs','property_optimization_actions'] loop
    execute format('alter table public.%I enable row level security',t);
    execute format('revoke all on public.%I from public,anon,authenticated',t);
    execute format('grant all on public.%I to service_role',t);
  end loop;
end $$;
grant usage,select on sequence public.admin_audit_events_id_seq to service_role;

create function public.gd_claim_job(p_key text, p_seconds integer) returns boolean
language plpgsql security invoker set search_path = '' as $$
declare claimed text;
begin
  if p_seconds < 60 or p_seconds > 86400 or length(p_key)>120 then raise exception 'invalid_job'; end if;
  insert into public.gd_job_leases(id,started_at) values(p_key,now())
  on conflict(id) do update set started_at=excluded.started_at
  where public.gd_job_leases.started_at < now()-make_interval(secs=>p_seconds)
  returning id into claimed;
  return claimed is not null;
end $$;
revoke all on function public.gd_claim_job(text,integer) from public,anon,authenticated;
grant execute on function public.gd_claim_job(text,integer) to service_role;

commit;
