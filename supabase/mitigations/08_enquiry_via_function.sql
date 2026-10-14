-- 08: enquiries can only be saved through the submit-enquiry Edge Function (Turnstile + email checks).
-- Run ONLY after submit-enquiry is deployed with its TURNSTILE_SECRET and the site sends enquiries to it;
-- before that, this would switch the contact form off. Safe to re-run.
-- NOTE: 12 re-adds the public insert policy because the site still inserts directly; re-run this file after switching.

-- Close direct public inserts: the function inserts as the service role, which bypasses row-level security.
drop policy if exists "anyone sends enquiries" on public.enquiries;

-- Same guard as 05, but for the function's service-role inserts the visitor's IP arrives in x-client-ip
-- (otherwise the function's own IP would be counted, and every visitor would share one 24-hour allowance).
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
