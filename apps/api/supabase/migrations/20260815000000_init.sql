-- Initial schema for khairibo.
-- Source of truth: SUPABASE_SETUP.md (claude.ai/design project "Khairibo
-- Mobile App Design"). Transcribed as written per architecture.md:
-- "The schema in that file applies as written." — EXCEPT `files` and
-- `notes`, renamed to `workspace_files` / `workspace_notes`: this Supabase
-- project already had tables by those names from an earlier, unrelated
-- schema (no user_id/folder_id, a `category` column instead) with real
-- data in them. Renaming ours avoids colliding with — or silently no-oping
-- against, via `create table if not exists` — that existing data.
--
-- Idempotent by design: every statement is safe to re-run. Useful because
-- a partial failure part-way through (a bad policy, a typo) otherwise
-- leaves you unable to re-run the whole file without hand-editing it.
--
-- Auth note: apps/api issues its own JWTs (lib/auth.ts, JWT_SECRET) rather
-- than using Supabase Auth sessions directly, and every query goes through
-- the service-role client, which bypasses RLS. The auth.uid()-based
-- policies below are therefore defense-in-depth (direct anon-key access,
-- future realtime subscriptions) rather than the primary access control —
-- the primary control is requireUser(req) + explicit .eq('user_id', ...)
-- in every handler. registering a user must still create a matching
-- auth.users row (via admin.auth.admin.createUser) so profiles.user_id has
-- a valid FK target.

-- ============================================================
-- 1. profiles
-- ============================================================
create table if not exists profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references auth.users(id) on delete cascade,
  email text unique, -- denormalized from auth.users; see 20260815000100_auth.sql
                      -- header for why (login needs a reliable email lookup)
  display_name text,
  avatar_url text,
  storage_quota bigint default 16106127360, -- 15GB in bytes
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index if not exists idx_profiles_user_id on profiles(user_id);
create index if not exists idx_profiles_email on profiles(email);

-- ============================================================
-- 2. folders
-- ============================================================
create table if not exists folders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  parent_id uuid references folders(id) on delete cascade,
  name text not null,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index if not exists idx_folders_user_id on folders(user_id);
create index if not exists idx_folders_parent_id on folders(parent_id);

-- ============================================================
-- 3. workspace_files (renamed from "files" — see header note)
-- ============================================================
create table if not exists workspace_files (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  folder_id uuid references folders(id) on delete set null,
  name text not null,
  mime_type text,
  size bigint,
  storage_path text not null, -- "user/{user_id}/files/{file_id}"
  thumbnail_url text,
  is_favorite boolean default false,
  is_deleted boolean default false,
  deleted_at timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index if not exists idx_workspace_files_user_id on workspace_files(user_id);
create index if not exists idx_workspace_files_folder_id on workspace_files(folder_id);
create index if not exists idx_workspace_files_is_deleted on workspace_files(is_deleted);

-- ============================================================
-- 4. file_versions
-- ============================================================
create table if not exists file_versions (
  id uuid primary key default gen_random_uuid(),
  file_id uuid not null references workspace_files(id) on delete cascade,
  version_number integer not null,
  storage_path text not null,
  size bigint,
  created_at timestamptz default now()
);

create index if not exists idx_file_versions_file_id on file_versions(file_id);

-- ============================================================
-- 5. workspace_notes (renamed from "notes" — see header note)
-- ============================================================
create table if not exists workspace_notes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  folder_id uuid references folders(id) on delete set null,
  title text not null default 'Untitled Note',
  content text,
  is_pinned boolean default false,
  is_archived boolean default false,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index if not exists idx_workspace_notes_user_id on workspace_notes(user_id);
create index if not exists idx_workspace_notes_folder_id on workspace_notes(folder_id);

-- ============================================================
-- 6. note_attachments
-- ============================================================
create table if not exists note_attachments (
  id uuid primary key default gen_random_uuid(),
  note_id uuid not null references workspace_notes(id) on delete cascade,
  file_id uuid not null references workspace_files(id) on delete cascade,
  attachment_type text, -- image, pdf, document
  created_at timestamptz default now()
);

create index if not exists idx_note_attachments_note_id on note_attachments(note_id);

-- ============================================================
-- 7. ai_conversations / ai_messages / ai_attachments
-- ============================================================
create table if not exists ai_conversations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  title text,
  model text default 'claude-3',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists ai_messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references ai_conversations(id) on delete cascade,
  role text not null check (role in ('user', 'assistant', 'system')),
  content text,
  tokens_used integer,
  created_at timestamptz default now()
);

create index if not exists idx_ai_messages_conversation_id on ai_messages(conversation_id);

create table if not exists ai_attachments (
  id uuid primary key default gen_random_uuid(),
  message_id uuid not null references ai_messages(id) on delete cascade,
  file_id uuid not null references workspace_files(id) on delete cascade,
  attachment_type text -- image, pdf, document
);

create index if not exists idx_ai_attachments_message_id on ai_attachments(message_id);

-- ============================================================
-- 8. ocr_results
-- ============================================================
create table if not exists ocr_results (
  id uuid primary key default gen_random_uuid(),
  file_id uuid not null references workspace_files(id) on delete cascade,
  extracted_text text,
  confidence float,
  language text,
  processing_status text default 'pending' check (processing_status in ('pending', 'completed', 'failed')),
  created_at timestamptz default now()
);

create index if not exists idx_ocr_results_file_id on ocr_results(file_id);
create index if not exists idx_ocr_results_status on ocr_results(processing_status);

-- ============================================================
-- 9. favorites / trash
-- (workspace_files.is_favorite / is_deleted already cover the common case;
--  these tables match SUPABASE_SETUP.md's overview as written)
-- ============================================================
create table if not exists favorites (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  file_id uuid not null references workspace_files(id) on delete cascade,
  created_at timestamptz default now(),
  unique (user_id, file_id)
);

create table if not exists trash (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  file_id uuid not null references workspace_files(id) on delete cascade,
  deleted_at timestamptz default now()
);

-- ============================================================
-- 10. integrations / google_drive_accounts
-- ============================================================
create table if not exists integrations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  provider text not null check (provider in ('google_drive', 'dropbox', 'onedrive')),
  access_token text not null,
  refresh_token text,
  is_active boolean default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index if not exists idx_integrations_user_id on integrations(user_id);
create index if not exists idx_integrations_provider on integrations(provider);

create table if not exists google_drive_accounts (
  id uuid primary key default gen_random_uuid(),
  integration_id uuid not null references integrations(id) on delete cascade,
  drive_user_id text,
  drive_user_email text,
  created_at timestamptz default now()
);

-- ============================================================
-- 11. activity_logs (powers the home-screen "Today / Yesterday" feed)
-- ============================================================
create table if not exists activity_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  action text not null, -- file_upload, file_delete, note_created, etc.
  resource_type text,   -- file, note, folder
  resource_id uuid,
  metadata jsonb,
  created_at timestamptz default now()
);

create index if not exists idx_activity_logs_user_id on activity_logs(user_id);
create index if not exists idx_activity_logs_created_at on activity_logs(created_at);

-- ============================================================
-- Grants
-- ============================================================
-- Belt-and-suspenders: a stock Supabase project already runs
-- `alter default privileges ... grant all on tables to anon, authenticated,
-- service_role` at provisioning time, so tables created here (as postgres,
-- via the SQL Editor or CLI) inherit those grants automatically. These
-- explicit grants make that non-obvious fact self-documenting instead of
-- relying on it silently. Granting broadly to `authenticated` is safe
-- because RLS is the actual gate — e.g. ocr_results has no authenticated
-- write policy above, so INSERT stays denied regardless of this grant.
-- `anon` gets nothing: every table here is private, and the app never
-- queries Supabase as anon anyway (mobile talks only to the Next.js API).
grant usage on schema public to authenticated, service_role;
grant all on all tables in schema public to authenticated, service_role;
grant all on all sequences in schema public to authenticated, service_role;
alter default privileges in schema public grant all on tables to authenticated, service_role;
alter default privileges in schema public grant all on sequences to authenticated, service_role;

-- ============================================================
-- Row Level Security
-- ============================================================
alter table profiles enable row level security;
alter table folders enable row level security;
alter table workspace_files enable row level security;
alter table file_versions enable row level security;
alter table workspace_notes enable row level security;
alter table note_attachments enable row level security;
alter table ai_conversations enable row level security;
alter table ai_messages enable row level security;
alter table ai_attachments enable row level security;
alter table ocr_results enable row level security;
alter table favorites enable row level security;
alter table trash enable row level security;
alter table integrations enable row level security;
alter table google_drive_accounts enable row level security;
alter table activity_logs enable row level security;

-- profiles
drop policy if exists profiles_select on profiles;
create policy profiles_select on profiles for select using ((select auth.uid()) = user_id);
drop policy if exists profiles_update on profiles;
create policy profiles_update on profiles for update using ((select auth.uid()) = user_id);
drop policy if exists profiles_insert on profiles;
create policy profiles_insert on profiles for insert with check ((select auth.uid()) = user_id);

-- workspace_files
drop policy if exists workspace_files_select on workspace_files;
create policy workspace_files_select on workspace_files for select using (user_id = (select id from profiles where user_id = (select auth.uid())));
drop policy if exists workspace_files_insert on workspace_files;
create policy workspace_files_insert on workspace_files for insert with check (user_id = (select id from profiles where user_id = (select auth.uid())));
drop policy if exists workspace_files_update on workspace_files;
create policy workspace_files_update on workspace_files for update using (user_id = (select id from profiles where user_id = (select auth.uid())));
drop policy if exists workspace_files_delete on workspace_files;
create policy workspace_files_delete on workspace_files for delete using (user_id = (select id from profiles where user_id = (select auth.uid())));

-- folders
drop policy if exists folders_select on folders;
create policy folders_select on folders for select using (user_id = (select id from profiles where user_id = (select auth.uid())));
drop policy if exists folders_insert on folders;
create policy folders_insert on folders for insert with check (user_id = (select id from profiles where user_id = (select auth.uid())));
drop policy if exists folders_update on folders;
create policy folders_update on folders for update using (user_id = (select id from profiles where user_id = (select auth.uid())));
drop policy if exists folders_delete on folders;
create policy folders_delete on folders for delete using (user_id = (select id from profiles where user_id = (select auth.uid())));

-- workspace_notes
drop policy if exists workspace_notes_select on workspace_notes;
create policy workspace_notes_select on workspace_notes for select using (user_id = (select id from profiles where user_id = (select auth.uid())));
drop policy if exists workspace_notes_insert on workspace_notes;
create policy workspace_notes_insert on workspace_notes for insert with check (user_id = (select id from profiles where user_id = (select auth.uid())));
drop policy if exists workspace_notes_update on workspace_notes;
create policy workspace_notes_update on workspace_notes for update using (user_id = (select id from profiles where user_id = (select auth.uid())));
drop policy if exists workspace_notes_delete on workspace_notes;
create policy workspace_notes_delete on workspace_notes for delete using (user_id = (select id from profiles where user_id = (select auth.uid())));

-- ai_conversations / ai_messages
drop policy if exists ai_conversations_select on ai_conversations;
create policy ai_conversations_select on ai_conversations for select using (user_id = (select id from profiles where user_id = (select auth.uid())));
drop policy if exists ai_conversations_insert on ai_conversations;
create policy ai_conversations_insert on ai_conversations for insert with check (user_id = (select id from profiles where user_id = (select auth.uid())));
drop policy if exists ai_messages_select on ai_messages;
create policy ai_messages_select on ai_messages for select using (conversation_id in (select id from ai_conversations where user_id = (select id from profiles where user_id = (select auth.uid()))));
drop policy if exists ai_messages_insert on ai_messages;
create policy ai_messages_insert on ai_messages for insert with check (conversation_id in (select id from ai_conversations where user_id = (select id from profiles where user_id = (select auth.uid()))));

-- remaining tables: owner-only, same shape (not spelled out in
-- SUPABASE_SETUP.md's policy section, added here for parity since RLS is
-- enabled on every table above)
drop policy if exists file_versions_select on file_versions;
create policy file_versions_select on file_versions for select using (file_id in (select id from workspace_files where user_id = (select id from profiles where user_id = (select auth.uid()))));
drop policy if exists note_attachments_select on note_attachments;
create policy note_attachments_select on note_attachments for select using (note_id in (select id from workspace_notes where user_id = (select id from profiles where user_id = (select auth.uid()))));
drop policy if exists ai_attachments_select on ai_attachments;
create policy ai_attachments_select on ai_attachments for select using (message_id in (select id from ai_messages where conversation_id in (select id from ai_conversations where user_id = (select id from profiles where user_id = (select auth.uid())))));
drop policy if exists ocr_results_select on ocr_results;
create policy ocr_results_select on ocr_results for select using (file_id in (select id from workspace_files where user_id = (select id from profiles where user_id = (select auth.uid()))));
drop policy if exists favorites_all on favorites;
create policy favorites_all on favorites for all using (user_id = (select id from profiles where user_id = (select auth.uid())));
drop policy if exists trash_all on trash;
create policy trash_all on trash for all using (user_id = (select id from profiles where user_id = (select auth.uid())));
drop policy if exists integrations_all on integrations;
create policy integrations_all on integrations for all using (user_id = (select id from profiles where user_id = (select auth.uid())));
drop policy if exists google_drive_accounts_select on google_drive_accounts;
create policy google_drive_accounts_select on google_drive_accounts for select using (integration_id in (select id from integrations where user_id = (select id from profiles where user_id = (select auth.uid()))));
drop policy if exists activity_logs_select on activity_logs;
create policy activity_logs_select on activity_logs for select using (user_id = (select id from profiles where user_id = (select auth.uid())));
drop policy if exists activity_logs_insert on activity_logs;
create policy activity_logs_insert on activity_logs for insert with check (user_id = (select id from profiles where user_id = (select auth.uid())));

-- ============================================================
-- Storage buckets + policies
-- (bucket names live in storage.buckets, a separate namespace from public
-- tables — 'files'/'thumbnails' here don't collide with the pre-existing
-- 'assets' bucket or the workspace_files/workspace_notes rename above)
-- ============================================================
insert into storage.buckets (id, name, public) values ('files', 'files', false)
  on conflict (id) do nothing;
insert into storage.buckets (id, name, public) values ('thumbnails', 'thumbnails', false)
  on conflict (id) do nothing;

drop policy if exists "Users can upload files" on storage.objects;
create policy "Users can upload files"
  on storage.objects for insert
  with check (bucket_id = 'files' and (select auth.uid())::text = (string_to_array(name, '/'))[2]);

drop policy if exists "Users can read their files" on storage.objects;
create policy "Users can read their files"
  on storage.objects for select
  using (bucket_id = 'files' and (select auth.uid())::text = (string_to_array(name, '/'))[2]);

drop policy if exists "Users can delete their files" on storage.objects;
create policy "Users can delete their files"
  on storage.objects for delete
  using (bucket_id = 'files' and (select auth.uid())::text = (string_to_array(name, '/'))[2]);

drop policy if exists "Users can upload thumbnails" on storage.objects;
create policy "Users can upload thumbnails"
  on storage.objects for insert
  with check (bucket_id = 'thumbnails' and (select auth.uid())::text = (string_to_array(name, '/'))[2]);

drop policy if exists "Users can read thumbnails" on storage.objects;
create policy "Users can read thumbnails"
  on storage.objects for select
  using (bucket_id = 'thumbnails' and (select auth.uid())::text = (string_to_array(name, '/'))[2]);

-- ============================================================
-- Default folders for new users
-- ============================================================
create or replace function create_default_folders()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.folders (user_id, name, parent_id) values
    (new.id, 'Documents', null),
    (new.id, 'Photos', null),
    (new.id, 'Important', null),
    (new.id, 'Archive', null);
  return new;
end;
$$;

drop trigger if exists on_profile_created on profiles;
create trigger on_profile_created
after insert on profiles
for each row
execute function create_default_folders();

-- ============================================================
-- TODO: user_analytics_summary(p_user uuid) — apps/api/app/api/analytics/summary/route.ts
-- already calls admin.rpc('user_analytics_summary', { p_user: user.id })
-- but this function isn't defined in SUPABASE_SETUP.md. Needs to return a
-- row shaped like packages/shared/schema.ts's AnalyticsSummary (storage
-- usage from workspace_files, filesThisWeek/aiQueries deltas from
-- activity_logs + ai_messages, 7-day activity histogram). Not written
-- speculatively here — build it once the aggregation rules are confirmed.
-- ============================================================
