-- Per-user settings (notification choices, low-stock threshold, ...), edited
-- from the Settings tab of each dashboard. Stored as a small JSON object so new
-- options can be added without another migration.
--
-- Users can already update their own profile row (see "profiles: update own or
-- admin"), and protect_profile only locks role, status, email and created_at,
-- so no policy changes are needed.

alter table public.profiles
  add column if not exists settings jsonb not null default '{}'::jsonb;

alter table public.profiles
  drop constraint if exists profiles_settings_shape;

alter table public.profiles
  add constraint profiles_settings_shape check (
    jsonb_typeof(settings) = 'object' and pg_column_size(settings) <= 4096
  );
