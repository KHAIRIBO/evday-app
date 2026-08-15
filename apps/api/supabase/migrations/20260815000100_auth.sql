-- Auth infrastructure for the custom passwordless (email-code) flow.
-- Not in SUPABASE_SETUP.md — that file only covers the product schema.
-- apps/api issues its own JWTs (lib/auth.ts), so it needs somewhere to
-- store the one-time email codes and the rotating refresh tokens itself;
-- Supabase Auth's own session machinery isn't used for either.
--
-- Design: register and login both just "send a code to an email". On
-- verify: purpose='register' creates the account if it doesn't exist,
-- purpose='login' requires it already exists. Both issue a short-lived
-- access token (JWT) + a rotating opaque refresh token. This matches the
-- mobile UI already built — there's a passcode/Touch ID screen (a LOCAL
-- lock on the stored refresh token, per architecture.md, never sent to the
-- server) and an email-code verify screen, but no password field anywhere.
--
-- profiles.email (added in 20260815000000_init.sql, denormalized from
-- auth.users) is what makes "login" possible without depending on the
-- GoTrue admin API's undocumented user-search/filter behavior — it's a
-- plain indexed lookup instead.

create table if not exists email_verifications (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  purpose text not null check (purpose in ('register', 'login')),
  code_hash text not null, -- sha256 of the 6-digit code — never store it plain
  attempts int not null default 0,
  max_attempts int not null default 5,
  consumed_at timestamptz,
  expires_at timestamptz not null,
  created_at timestamptz not null default now()
);

create index if not exists idx_email_verifications_lookup on email_verifications(email, purpose, consumed_at, expires_at);

-- auth_sessions holds refresh tokens (hashed) with rotation. A refresh
-- token that's already been rotated away (revoked_at set, replaced_by
-- populated) but gets presented again indicates token theft — refresh
-- handling below revokes the whole chain when that happens.
create table if not exists auth_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  refresh_token_hash text not null unique,
  replaced_by uuid references auth_sessions(id),
  revoked_at timestamptz,
  expires_at timestamptz not null,
  created_at timestamptz not null default now()
);

create index if not exists idx_auth_sessions_user_id on auth_sessions(user_id);
create index if not exists idx_auth_sessions_token_hash on auth_sessions(refresh_token_hash);

-- Both tables are written/read exclusively by the service-role client
-- (lib/auth.ts, app/api/auth/*) — never queried by an end-user session —
-- so RLS is enabled with no policies at all, i.e. default-deny for
-- anon/authenticated. That's intentional, not an oversight.
alter table email_verifications enable row level security;
alter table auth_sessions enable row level security;

grant all on email_verifications to service_role;
grant all on auth_sessions to service_role;
