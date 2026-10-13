-- 05: anti-spam for the contact form: one enquiry per email address and per network (IP) every 24 hours.
-- Run after 02 and 03. Paste the whole file into the Supabase SQL editor (nothing highlighted) and Run. Safe to re-run.
create extension if not exists pgcrypto with schema extensions;

-- Only a one-way hash of the IP is kept (never the address itself), just enough to spot repeats.
alter table public.enquiries add column if not exists ip_hash text;

create index if not exists enquiries_email_recent on public.enquiries (lower(email), created_at);
create index if not exists enquiries_ip_recent on public.enquiries (ip_hash, created_at);

-- security definer: visitors may insert but can't read the table, so the repeat check runs as the table owner.
create or replace function public.enquiry_guard() returns trigger
language plpgsql security definer set search_path = public, extensions as $$
declare
  headers json := coalesce(nullif(current_setting('request.headers', true), ''), '{}')::json;
  ip text := coalesce(
    headers ->> 'cf-connecting-ip',
    headers ->> 'x-real-ip',
    trim(split_part(coalesce(headers ->> 'x-forwarded-for', ''), ',', 1))
  );
begin
  new.email := lower(trim(new.email));
  new.ip_hash := case when coalesce(ip, '') = '' then null
    else encode(digest(ip || ':rrds-enquiry', 'sha256'), 'hex') end;

  if exists (
    select 1 from public.enquiries e
    where e.created_at > now() - interval '24 hours'
      and (lower(e.email) = new.email or (new.ip_hash is not null and e.ip_hash = new.ip_hash))
  ) then
    -- The site matches this exact text to show "you've already sent an enquiry".
    raise exception 'already_submitted' using errcode = 'P0001';
  end if;

  return new;
end;
$$;

drop trigger if exists enquiry_guard on public.enquiries;
create trigger enquiry_guard before insert on public.enquiries
  for each row execute function public.enquiry_guard();
