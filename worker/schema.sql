-- D1 (SQLite) schema. Apply once: npx wrangler d1 execute portfolio --remote --file worker/schema.sql
-- Safe to re-run. Same shape and limits as the old Supabase tables (supabase/mitigations 01, 02, 03, 05).

-- The CMS-editable slice of the site: one row, key 'site', value = JSON text.
create table if not exists content (
  key text primary key,
  value text not null,
  updated_at text not null
);

-- Times are ISO 8601 UTC strings, so text comparison orders them correctly.
create table if not exists enquiries (
  id text primary key,
  created_at text not null,
  name text not null check (length(name) between 1 and 200),
  email text not null check (length(email) between 3 and 320),
  company text not null default '' check (length(company) <= 200),
  service text not null default '' check (length(service) <= 200),
  timeline text not null default '' check (length(timeline) <= 200),
  message text not null check (length(message) between 1 and 5000),
  read integer not null default 0,
  status text not null default 'inbox' check (status in ('inbox', 'archived', 'deleted')),
  deleted_at text,
  ip_hash text
);
create index if not exists enquiries_email_created on enquiries (email, created_at);
create index if not exists enquiries_ip_created on enquiries (ip_hash, created_at);

-- Failed CMS logins per hashed IP, for the login rate limit.
create table if not exists login_failures (
  ip_hash text not null,
  at text not null
);
create index if not exists login_failures_ip_at on login_failures (ip_hash, at);

-- The one CMS account (a single row, created at the first sign-in; see login() in worker/index.ts).
-- session_ver is part of every session cookie; bumping it (password change) signs other browsers out.
create table if not exists users (
  id text primary key,
  email text not null unique check (length(email) between 3 and 320),
  pw_hash text not null,
  session_ver integer not null default 0,
  created_at text not null,
  last_login_at text
);
