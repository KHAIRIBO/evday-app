-- Initial schema for khairibo (Personal Workspace App).
-- Source: SUPABASE_SETUP.md (Claude Design project "Khairibo Mobile App
-- Design"). Tables and RLS policies from that doc are applied as written;
-- a few child tables it only described in the overview diagram (no SQL
-- given) get equivalent CREATE TABLE + policies here, following the same
-- conventions, so "RLS enabled on every table" (architecture.md) actually
-- holds. Applied only via apps/api's service-role client for now — RLS is
-- defence in depth per architecture.md, not the active enforcement layer
-- (that's `requireUser` deriving user.id from the verified JWT).

create extension if not exists pgcrypto;

-- ============================================================
-- Tables
-- ============================================================

create table profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references auth.users(id) on delete cascade,
  display_name text,
  avatar_url text,
  storage_quota bigint default 16106127360, -- 15GB in bytes
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table folders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  parent_id uuid references folders(id) on delete cascade,
  name text not null,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table files (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  folder_id uuid references folders(id) on delete set null,
  name text not null,
  mime_type text,
  size bigint,
  storage_path text not null,
  thumbnail_url text,
  is_favorite boolean default false,
  is_deleted boolean default false,
  deleted_at timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table file_versions (
  id uuid primary key default gen_random_uuid(),
  file_id uuid not null references files(id) on delete cascade,
  version_number integer not null,
  storage_path text not null,
  size bigint,
  created_at timestamptz default now()
);

create table notes (
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

create table note_attachments (
  id uuid primary key default gen_random_uuid(),
  note_id uuid not null references notes(id) on delete cascade,
  file_id uuid not null references files(id) on delete cascade,
  attachment_type text check (attachment_type in ('image', 'pdf', 'document')),
  created_at timestamptz default now()
);

create table ai_conversations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  title text,
  model text default 'gpt-4',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table ai_messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references ai_conversations(id) on delete cascade,
  role text not null check (role in ('user', 'assistant', 'system')),
  content text,
  tokens_used integer,
  created_at timestamptz default now()
);

create table ai_attachments (
  id uuid primary key default gen_random_uuid(),
  message_id uuid not null references ai_messages(id) on delete cascade,
  file_id uuid not null references files(id) on delete cascade,
  attachment_type text check (attachment_type in ('image', 'pdf', 'document')),
  created_at timestamptz default now()
);

create table ocr_results (
  id uuid primary key default gen_random_uuid(),
  file_id uuid not null references files(id) on delete cascade,
  extracted_text text,
  confidence float,
  language text,
  processing_status text default 'pending' check (processing_status in ('pending', 'completed', 'failed')),
  created_at timestamptz default now()
);

create table favorites (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  file_id uuid not null references files(id) on delete cascade,
  created_at timestamptz default now(),
  unique (user_id, file_id)
);

create table trash (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  file_id uuid not null references files(id) on delete cascade,
  deleted_at timestamptz default now()
);

create table integrations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  provider text not null check (provider in ('google_drive', 'dropbox', 'onedrive')),
  access_token text not null,
  refresh_token text,
  is_active boolean default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table google_drive_accounts (
  id uuid primary key default gen_random_uuid(),
  integration_id uuid not null references integrations(id) on delete cascade,
  drive_user_id text,
  drive_user_email text,
  created_at timestamptz default now()
);

create table activity_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  action text not null,
  resource_type text check (resource_type in ('file', 'note', 'folder')),
  resource_id uuid,
  metadata jsonb,
  created_at timestamptz default now()
);

-- ============================================================
-- Indexes
-- ============================================================

create index idx_profiles_user_id on profiles(user_id);

create index idx_folders_user_id on folders(user_id);
create index idx_folders_parent_id on folders(parent_id);

create index idx_files_user_id on files(user_id);
create index idx_files_folder_id on files(folder_id);
create index idx_files_is_deleted on files(is_deleted);

create index idx_file_versions_file_id on file_versions(file_id);

create index idx_notes_user_id on notes(user_id);
create index idx_notes_folder_id on notes(folder_id);

create index idx_note_attachments_note_id on note_attachments(note_id);

create index idx_ai_conversations_user_id on ai_conversations(user_id);
create index idx_ai_messages_conversation_id on ai_messages(conversation_id);
create index idx_ai_attachments_message_id on ai_attachments(message_id);

create index idx_ocr_results_file_id on ocr_results(file_id);
create index idx_ocr_results_status on ocr_results(processing_status);

create index idx_favorites_user_id on favorites(user_id);
create index idx_trash_user_id on trash(user_id);

create index idx_integrations_user_id on integrations(user_id);
create index idx_integrations_provider on integrations(provider);
create index idx_google_drive_accounts_integration_id on google_drive_accounts(integration_id);

create index idx_activity_logs_user_id on activity_logs(user_id);
create index idx_activity_logs_created_at on activity_logs(created_at desc);

-- ============================================================
-- Row Level Security
-- ============================================================

alter table profiles enable row level security;
alter table folders enable row level security;
alter table files enable row level security;
alter table file_versions enable row level security;
alter table notes enable row level security;
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

create policy profiles_select on profiles for select using (auth.uid() = user_id);
create policy profiles_update on profiles for update using (auth.uid() = user_id);
create policy profiles_insert on profiles for insert with check (auth.uid() = user_id);

-- folders

create policy folders_select on folders for select using (user_id = (select id from profiles where user_id = auth.uid()));
create policy folders_insert on folders for insert with check (user_id = (select id from profiles where user_id = auth.uid()));
create policy folders_update on folders for update using (user_id = (select id from profiles where user_id = auth.uid()));
create policy folders_delete on folders for delete using (user_id = (select id from profiles where user_id = auth.uid()));

-- files

create policy files_select on files for select using (user_id = (select id from profiles where user_id = auth.uid()));
create policy files_insert on files for insert with check (user_id = (select id from profiles where user_id = auth.uid()));
create policy files_update on files for update using (user_id = (select id from profiles where user_id = auth.uid()));
create policy files_delete on files for delete using (user_id = (select id from profiles where user_id = auth.uid()));

-- file_versions (via files.user_id)

create policy file_versions_select on file_versions for select using (
  file_id in (select id from files where user_id = (select id from profiles where user_id = auth.uid()))
);
create policy file_versions_insert on file_versions for insert with check (
  file_id in (select id from files where user_id = (select id from profiles where user_id = auth.uid()))
);

-- notes

create policy notes_select on notes for select using (user_id = (select id from profiles where user_id = auth.uid()));
create policy notes_insert on notes for insert with check (user_id = (select id from profiles where user_id = auth.uid()));
create policy notes_update on notes for update using (user_id = (select id from profiles where user_id = auth.uid()));
create policy notes_delete on notes for delete using (user_id = (select id from profiles where user_id = auth.uid()));

-- note_attachments (via notes.user_id)

create policy note_attachments_select on note_attachments for select using (
  note_id in (select id from notes where user_id = (select id from profiles where user_id = auth.uid()))
);
create policy note_attachments_insert on note_attachments for insert with check (
  note_id in (select id from notes where user_id = (select id from profiles where user_id = auth.uid()))
);
create policy note_attachments_delete on note_attachments for delete using (
  note_id in (select id from notes where user_id = (select id from profiles where user_id = auth.uid()))
);

-- ai_conversations / ai_messages / ai_attachments

create policy ai_conversations_select on ai_conversations for select using (user_id = (select id from profiles where user_id = auth.uid()));
create policy ai_conversations_insert on ai_conversations for insert with check (user_id = (select id from profiles where user_id = auth.uid()));

create policy ai_messages_select on ai_messages for select using (
  conversation_id in (select id from ai_conversations where user_id = (select id from profiles where user_id = auth.uid()))
);
create policy ai_messages_insert on ai_messages for insert with check (
  conversation_id in (select id from ai_conversations where user_id = (select id from profiles where user_id = auth.uid()))
);

create policy ai_attachments_select on ai_attachments for select using (
  message_id in (
    select m.id from ai_messages m
    join ai_conversations c on c.id = m.conversation_id
    where c.user_id = (select id from profiles where user_id = auth.uid())
  )
);
create policy ai_attachments_insert on ai_attachments for insert with check (
  message_id in (
    select m.id from ai_messages m
    join ai_conversations c on c.id = m.conversation_id
    where c.user_id = (select id from profiles where user_id = auth.uid())
  )
);

-- ocr_results (via files.user_id)

create policy ocr_results_select on ocr_results for select using (
  file_id in (select id from files where user_id = (select id from profiles where user_id = auth.uid()))
);
create policy ocr_results_insert on ocr_results for insert with check (
  file_id in (select id from files where user_id = (select id from profiles where user_id = auth.uid()))
);

-- favorites / trash

create policy favorites_select on favorites for select using (user_id = (select id from profiles where user_id = auth.uid()));
create policy favorites_insert on favorites for insert with check (user_id = (select id from profiles where user_id = auth.uid()));
create policy favorites_delete on favorites for delete using (user_id = (select id from profiles where user_id = auth.uid()));

create policy trash_select on trash for select using (user_id = (select id from profiles where user_id = auth.uid()));
create policy trash_insert on trash for insert with check (user_id = (select id from profiles where user_id = auth.uid()));
create policy trash_delete on trash for delete using (user_id = (select id from profiles where user_id = auth.uid()));

-- integrations / google_drive_accounts

create policy integrations_select on integrations for select using (user_id = (select id from profiles where user_id = auth.uid()));
create policy integrations_insert on integrations for insert with check (user_id = (select id from profiles where user_id = auth.uid()));
create policy integrations_update on integrations for update using (user_id = (select id from profiles where user_id = auth.uid()));
create policy integrations_delete on integrations for delete using (user_id = (select id from profiles where user_id = auth.uid()));

create policy google_drive_accounts_select on google_drive_accounts for select using (
  integration_id in (select id from integrations where user_id = (select id from profiles where user_id = auth.uid()))
);

-- activity_logs (read-only from the client's perspective; server/service-role writes)

create policy activity_logs_select on activity_logs for select using (user_id = (select id from profiles where user_id = auth.uid()));

-- ============================================================
-- Storage buckets
-- ============================================================

insert into storage.buckets (id, name, public) values ('files', 'files', false)
  on conflict (id) do nothing;
insert into storage.buckets (id, name, public) values ('thumbnails', 'thumbnails', false)
  on conflict (id) do nothing;

create policy "Users can upload files"
  on storage.objects for insert
  with check (bucket_id = 'files' and auth.uid()::text = (string_to_array(name, '/'))[2]);

create policy "Users can read their files"
  on storage.objects for select
  using (bucket_id = 'files' and auth.uid()::text = (string_to_array(name, '/'))[2]);

create policy "Users can delete their files"
  on storage.objects for delete
  using (bucket_id = 'files' and auth.uid()::text = (string_to_array(name, '/'))[2]);

create policy "Users can upload thumbnails"
  on storage.objects for insert
  with check (bucket_id = 'thumbnails' and auth.uid()::text = (string_to_array(name, '/'))[2]);

create policy "Users can read thumbnails"
  on storage.objects for select
  using (bucket_id = 'thumbnails' and auth.uid()::text = (string_to_array(name, '/'))[2]);

-- ============================================================
-- Default folders for new users
-- ============================================================

create or replace function create_default_folders()
returns trigger as $$
begin
  insert into folders (user_id, name, parent_id) values
    (new.id, 'Documents', null),
    (new.id, 'Photos', null),
    (new.id, 'Important', null),
    (new.id, 'Archive', null);
  return new;
end;
$$ language plpgsql security definer;

create trigger on_profile_created
after insert on profiles
for each row
execute function create_default_folders();
