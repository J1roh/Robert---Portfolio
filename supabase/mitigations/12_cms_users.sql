-- 12: every CMS account can publish, not just one hard-coded email. Paste the whole file into the
-- Supabase SQL editor (nothing highlighted) and Run. Safe to re-run. Replaces the email checks in 01–04.
-- Anyone in Authentication > Users can now edit the site, so keep "Allow new users to sign up" OFF
-- and add CMS users by hand (Authentication > Users > Add user).

-- One place for the rule: any signed-in user except an anonymous sign-in.
create or replace function public.is_cms_user() returns boolean
language sql stable
as $$ select not coalesce((auth.jwt() ->> 'is_anonymous')::boolean, false) $$;

drop policy if exists "admin inserts content" on public.content;
drop policy if exists "admin updates content" on public.content;
drop policy if exists "admin reads enquiries" on public.enquiries;
drop policy if exists "admin deletes enquiries" on public.enquiries;
drop policy if exists "admin updates enquiries" on public.enquiries;
drop policy if exists "admin uploads posters" on storage.objects;

create policy "admin inserts content" on public.content
  for insert to authenticated with check (public.is_cms_user());

create policy "admin updates content" on public.content
  for update to authenticated
  using (public.is_cms_user())
  with check (public.is_cms_user());

create policy "admin reads enquiries" on public.enquiries
  for select to authenticated using (public.is_cms_user());

create policy "admin deletes enquiries" on public.enquiries
  for delete to authenticated using (public.is_cms_user());

create policy "admin updates enquiries" on public.enquiries
  for update to authenticated
  using (public.is_cms_user())
  with check (public.is_cms_user());

create policy "admin uploads posters" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'posters' and public.is_cms_user());
