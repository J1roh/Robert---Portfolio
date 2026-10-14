-- 13: the contact form allows 3 enquiries per email address or network (IP) every 2 days (was 1 per 24 hours).
-- Run after 08. Paste the whole file into the Supabase SQL editor (nothing highlighted) and Run. Safe to re-run.
-- Same as 08's guard (IP from x-client-ip for the function's service-role inserts) with a count instead of exists.
create or replace function public.enquiry_guard() returns trigger
language plpgsql security definer set search_path = public, extensions as $$
declare
  headers json := coalesce(nullif(current_setting('request.headers', true), ''), '{}')::json;
  claims json := coalesce(nullif(current_setting('request.jwt.claims', true), ''), '{}')::json;
  ip text := case
    when claims ->> 'role' = 'service_role' and coalesce(headers ->> 'x-client-ip', '') <> '' then headers ->> 'x-client-ip'
    else coalesce(
      headers ->> 'cf-connecting-ip',
      headers ->> 'x-real-ip',
      trim(split_part(coalesce(headers ->> 'x-forwarded-for', ''), ',', 1))
    )
  end;
begin
  new.email := lower(trim(new.email));
  new.ip_hash := case when coalesce(ip, '') = '' then null
    else encode(digest(ip || ':rrds-enquiry', 'sha256'), 'hex') end;

  if (
    select count(*) from public.enquiries e
    where e.created_at > now() - interval '2 days'
      and (lower(e.email) = new.email or (new.ip_hash is not null and e.ip_hash = new.ip_hash))
  ) >= 3 then
    -- The site matches this exact text to show "you've already sent an enquiry".
    raise exception 'already_submitted' using errcode = 'P0001';
  end if;

  return new;
end;
$$;
