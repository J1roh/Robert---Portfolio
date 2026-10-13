-- 04: storage bucket for title images uploaded in the CMS "Edit project" modal. Paste the whole file into the
-- Supabase SQL editor (nothing highlighted) and Run. Safe to re-run. The admin email must match 01.
insert into storage.buckets (id, name, public)
values ('posters', 'posters', true)
on conflict (id) do update set public = true;

-- Dropped first so this file can be re-run safely.
drop policy if exists "posters are public" on storage.objects;
drop policy if exists "admin uploads posters" on storage.objects;

-- Anyone can view: the public site shows these images in the project modal and coverflow.
create policy "posters are public" on storage.objects
  for select to anon, authenticated using (bucket_id = 'posters');

-- Only the admin can upload, so a stray signup can't add files.
create policy "admin uploads posters" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'posters' and auth.jwt() ->> 'email' = 'bontilaojiroh17@gmail.com');
