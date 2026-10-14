-- 07: email every new enquiry to the owner. Does what a dashboard "Database Webhook" would, without needing
-- that integration: after each insert, pg_net POSTs the row to the notify-enquiry Edge Function.
-- Run after 05 and 06. Safe to re-run.
--
-- The shared secret lives in Vault (encrypted), never in this file. Store it once, with the same value as the
-- function's WEBHOOK_SECRET:
--   select vault.create_secret('<secret>', 'notify_enquiry_secret');          -- first time
--   select vault.update_secret(id, '<secret>') from vault.secrets where name = 'notify_enquiry_secret';  -- to change it
create extension if not exists pg_net with schema extensions;

create or replace function public.notify_enquiry() returns trigger
language plpgsql security definer set search_path = public as $$
declare
  secret text;
begin
  select decrypted_secret into secret from vault.decrypted_secrets where name = 'notify_enquiry_secret';
  if secret is null then
    return new;
  end if;

  -- Queued and sent in the background, so the visitor's submit never waits on the email.
  perform net.http_post(
    url := 'https://kadytgyfsfrdzztsqrqv.supabase.co/functions/v1/notify-enquiry',
    headers := jsonb_build_object('Content-Type', 'application/json', 'x-webhook-secret', secret),
    body := jsonb_build_object('type', 'INSERT', 'table', 'enquiries', 'record', to_jsonb(new) - 'ip_hash'),
    timeout_milliseconds := 5000
  );
  return new;
exception when others then
  -- An email problem must never lose the enquiry itself.
  raise warning 'notify_enquiry failed: %', sqlerrm;
  return new;
end;
$$;

drop trigger if exists notify_enquiry on public.enquiries;
create trigger notify_enquiry after insert on public.enquiries
  for each row execute function public.notify_enquiry();
