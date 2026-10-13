-- 01: content table for the CMS. Paste the whole file into the Supabase SQL editor (nothing highlighted) and Run.
-- Safe to re-run. The admin email below must match your admin user (Auth > Users).
create table if not exists public.content (
  key text primary key,
  value jsonb not null,
  updated_at timestamptz not null default now()
);

alter table public.content enable row level security;

-- Dropped first so this file can be re-run safely.
drop policy if exists "content is public" on public.content;
drop policy if exists "admin inserts content" on public.content;
drop policy if exists "admin updates content" on public.content;

-- Anyone can read: the public site loads its CMS content from here.
create policy "content is public" on public.content
  for select to anon, authenticated using (true);

-- Only the admin can write, so a stray signup can't edit the site.
create policy "admin inserts content" on public.content
  for insert to authenticated with check (auth.jwt() ->> 'email' = 'bontilaojiroh17@gmail.com');

create policy "admin updates content" on public.content
  for update to authenticated
  using (auth.jwt() ->> 'email' = 'bontilaojiroh17@gmail.com')
  with check (auth.jwt() ->> 'email' = 'bontilaojiroh17@gmail.com');
