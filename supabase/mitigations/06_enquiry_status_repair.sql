-- 06: repairs the folder columns from 03 on tables where they already existed without defaults.
-- Symptom: enquiries counted as unread in the CMS but missing from every folder (Inbox / Archive / Recently deleted),
-- and new contact-form enquiries possibly refused. Paste the whole file into the Supabase SQL editor and Run. Safe to re-run.

-- Existing rows with no folder or read flag become unread Inbox messages.
update public.enquiries set status = 'inbox' where status is null or status not in ('inbox', 'archived', 'deleted');
update public.enquiries set read = false where read is null;

-- New rows always get a folder and a read flag, which the contact form's insert rule (03) requires.
alter table public.enquiries alter column status set default 'inbox';
alter table public.enquiries alter column status set not null;
alter table public.enquiries alter column read set default false;
alter table public.enquiries alter column read set not null;
