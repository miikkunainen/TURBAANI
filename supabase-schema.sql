-- Run once in your OWN Supabase project's SQL Editor.
-- No player data is readable through the browser's public API key.
create table if not exists public.purjehdus_rooms (
  code text primary key,
  payload jsonb not null,
  updated_at timestamptz not null default now(),
  expires_at timestamptz not null default now() + interval '7 days'
);
alter table public.purjehdus_rooms add column if not exists expires_at timestamptz not null default now() + interval '7 days';
alter table public.purjehdus_rooms enable row level security;
revoke all on table public.purjehdus_rooms from anon, authenticated;
grant select, insert, update, delete on table public.purjehdus_rooms to service_role;
-- Deliberately no anon/authenticated RLS policies.
-- Only the Render server's secret API key can access this table.
