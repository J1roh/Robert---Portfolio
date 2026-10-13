-- 03: read/unread and Inbox / Archive / Recently deleted folders for the CMS Enquiries page (#/cms/enquiries).
-- Run after 02. Paste the whole file into the Supabase SQL editor (nothing highlighted) and Run. Safe to re-run.
alter table public.enquiries add column if not exists read boolean not null default false;
alter table public.enquiries add column if not exists status text not null default 'inbox';
alter table public.enquiries add column if not exists deleted_at timestamptz;

alter table public.enquiries drop constraint if exists enquiries_status_check;
alter table public.enquiries add constraint enquiries_status_check check (status in ('inbox', 'archived', 'deleted'));

-- Dropped first so this file can be re-run safely.
drop policy if exists "anyone sends enquiries" on public.enquiries;
drop policy if exists "admin updates enquiries" on public.enquiries;

-- Visitors can only add new, unread inbox messages; they can't pre-file or pre-read them.
create policy "anyone sends enquiries" on public.enquiries
  for insert to anon, authenticated
  with check (status = 'inbox' and read = false and deleted_at is null);

-- The admin moves messages between folders and marks them read.
create policy "admin updates enquiries" on public.enquiries
  for update to authenticated
  using (auth.jwt() ->> 'email' = 'bontilaojiroh17@gmail.com')
  with check (auth.jwt() ->> 'email' = 'bontilaojiroh17@gmail.com');
