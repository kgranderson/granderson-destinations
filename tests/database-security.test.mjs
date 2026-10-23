import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { PGlite } from '@electric-sql/pglite';

test('migration prevents privilege escalation and public token access; leases are exclusive', async () => {
  const db = new PGlite();
  try {
    await db.exec(`
      create role anon; create role authenticated; create role service_role bypassrls;
      create schema auth; create function auth.uid() returns uuid language sql as $$select '11111111-1111-1111-1111-111111111111'::uuid$$;
      grant usage on schema auth to authenticated;
      create table public.profiles (id uuid primary key, tier text, full_name text, avatar_url text, phone text, onboarding_completed boolean, preferred_markets text[]);
      create function public.handle_new_user() returns trigger language plpgsql as $$begin return new; end$$;
      insert into profiles(id,tier) values('11111111-1111-1111-1111-111111111111','guest');
      alter table profiles enable row level security;
      create policy profiles_self_read on profiles for select to authenticated using(auth.uid()=id);
      create policy profiles_self_update on profiles for update to authenticated using(auth.uid()=id);
      grant select,update on profiles to authenticated;
      create table public.properties(id uuid primary key,ig_business_id text,ig_access_token text,ig_token_expires_at timestamptz,fb_page_id text,meta_ad_account_id text);
      insert into properties(id,ig_access_token) values('22222222-2222-2222-2222-222222222222','fixture-not-a-real-secret');
      grant select on properties to anon;
    `);
    await db.exec(await readFile(new URL('../supabase/migrations/20261023032000_reliability_property_intelligence.sql',import.meta.url),'utf8'));
    assert.equal((await db.query('select ig_access_token from property_integrations')).rows[0].ig_access_token,'fixture-not-a-real-secret');
    await db.exec('set role anon');
    assert.equal((await db.query('select ig_access_token from properties')).rows[0].ig_access_token,null);
    await assert.rejects(db.query('select * from property_integrations'),/permission denied/);
    await assert.rejects(db.query('select * from key_check_runs'),/permission denied/);
    await db.exec('reset role; set role authenticated');
    await assert.rejects(db.query("update profiles set tier='admin'"),/permission denied/);
    await db.exec("update profiles set full_name='Owner name'; reset role;");
    assert.equal((await db.query('select tier,full_name from profiles')).rows[0].tier,'guest');
    await assert.rejects(db.query("update properties set ig_access_token='new-secret'"),/no_public_provider_token/);
    await db.exec('set role service_role');
    assert.equal((await db.query("select gd_claim_job('test',600) as claimed")).rows[0].claimed,true);
    assert.equal((await db.query("select gd_claim_job('test',600) as claimed")).rows[0].claimed,false);
  } finally { await db.close(); }
});
