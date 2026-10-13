-- 02: enquiries from the contact page (#/contact). Paste the whole file into the Supabase SQL editor (nothing highlighted) and Run.
-- Safe to re-run. The admin email below must match your admin user (Auth > Users), same as 01.
create table if not exists public.enquiries (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  name text not null check (char_length(name) between 1 and 200),
  email text not null check (char_length(email) between 3 and 320),
  company text check (char_length(company) <= 200),
  service text check (char_length(service) <= 200),
  timeline text check (char_length(timeline) <= 200),
  message text not null check (char_length(message) between 1 and 5000)
);

alter table public.enquiries enable row level security;

-- Dropped first so this file can be re-run safely.
drop policy if exists "anyone sends enquiries" on public.enquiries;
drop policy if exists "admin reads enquiries" on public.enquiries;
drop policy if exists "admin deletes enquiries" on public.enquiries;

-- Visitors can only add; they can never read anyone's enquiry back.
create policy "anyone sends enquiries" on public.enquiries
  for insert to anon, authenticated with check (true);

create policy "admin reads enquiries" on public.enquiries
  for select to authenticated using (auth.jwt() ->> 'email' = 'bontilaojiroh17@gmail.com');

create policy "admin deletes enquiries" on public.enquiries
  for delete to authenticated using (auth.jwt() ->> 'email' = 'bontilaojiroh17@gmail.com');
