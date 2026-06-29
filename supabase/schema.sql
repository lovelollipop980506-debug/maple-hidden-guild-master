-- =============================================================
-- hddiscord — Supabase schema
-- Run this in the Supabase SQL editor (or via the CLI).
-- All app writes go through the server using the service_role key,
-- which bypasses RLS. RLS is enabled with no public policies so the
-- anon key cannot read/write these tables directly.
-- =============================================================

-- ---------- users ----------
-- One row per Discord account that has logged in.
create table if not exists public.users (
  discord_id      text primary key,
  username        text not null,
  global_name     text,
  avatar          text,
  roles           text[] not null default '{}',   -- raw Discord role IDs (snapshot at login)
  tier            text not null default 'guest',   -- resolved app tier: admin | reviewer | member | guest
  total_points    integer not null default 0,      -- cached sum of point_ledger
  member_status   text not null default 'none',    -- none | applied | approved | rejected
  joined_at       timestamptz,
  last_login      timestamptz,
  created_at      timestamptz not null default now()
);

-- ---------- applications (가입 신청서) ----------
create table if not exists public.applications (
  id              uuid primary key default gen_random_uuid(),
  applicant_id    text not null references public.users(discord_id) on delete cascade,
  form            jsonb not null default '{}',     -- flexible form payload
  status          text not null default 'pending', -- pending | approved | rejected
  reviewer_id     text references public.users(discord_id),
  review_note     text,
  created_at      timestamptz not null default now(),
  reviewed_at     timestamptz
);
create index if not exists applications_status_idx on public.applications(status, created_at desc);
create index if not exists applications_applicant_idx on public.applications(applicant_id);

-- ---------- skill_verifications (스킬포인트 인증) ----------
create table if not exists public.skill_verifications (
  id              uuid primary key default gen_random_uuid(),
  user_id         text not null references public.users(discord_id) on delete cascade,
  skill           text not null,                   -- skill / category name
  points          integer not null,                -- points claimed
  note            text,
  evidence_url    text,                            -- public URL in Supabase Storage
  status          text not null default 'pending', -- pending | approved | rejected
  reviewer_id     text references public.users(discord_id),
  review_note     text,
  created_at      timestamptz not null default now(),
  reviewed_at     timestamptz
);
create index if not exists skill_status_idx on public.skill_verifications(status, created_at desc);
create index if not exists skill_user_idx on public.skill_verifications(user_id);

-- ---------- point_ledger ----------
-- Append-only record of point changes. total_points on users is the cached sum.
create table if not exists public.point_ledger (
  id              uuid primary key default gen_random_uuid(),
  user_id         text not null references public.users(discord_id) on delete cascade,
  delta           integer not null,
  reason          text not null,
  source_type     text,                            -- e.g. 'skill_verification'
  source_id       uuid,
  created_by      text references public.users(discord_id),
  created_at      timestamptz not null default now()
);
create index if not exists ledger_user_idx on public.point_ledger(user_id, created_at desc);

-- ---------- messages (디스코드 채팅 수집) ----------
create table if not exists public.messages (
  id              text primary key,                -- Discord message ID (snowflake)
  channel_id      text not null,
  author_id       text not null,
  author_name     text not null,
  content         text,
  attachments     jsonb not null default '[]',     -- original attachment metadata
  image_url       text,                            -- re-hosted (permanent) image in Supabase Storage
  discord_created_at timestamptz not null,
  raw             jsonb,
  ingested_at     timestamptz not null default now()
);
create index if not exists messages_channel_idx on public.messages(channel_id, discord_created_at desc);

-- ---------- poll_cursor ----------
-- Tracks the last ingested message ID per channel for incremental polling.
create table if not exists public.poll_cursor (
  channel_id        text primary key,
  last_message_id   text,
  updated_at        timestamptz not null default now()
);

-- ---------- audit_log ----------
create table if not exists public.audit_log (
  id              uuid primary key default gen_random_uuid(),
  actor_id        text references public.users(discord_id),
  action          text not null,                   -- e.g. 'application.approve'
  target_type     text,
  target_id       text,
  detail          jsonb,
  created_at      timestamptz not null default now()
);
create index if not exists audit_created_idx on public.audit_log(created_at desc);

-- =============================================================
-- Enable RLS (no public policies => anon key has no access;
-- the server uses service_role which bypasses RLS).
-- =============================================================
alter table public.users enable row level security;
alter table public.applications enable row level security;
alter table public.skill_verifications enable row level security;
alter table public.point_ledger enable row level security;
alter table public.messages enable row level security;
alter table public.poll_cursor enable row level security;
alter table public.audit_log enable row level security;

-- =============================================================
-- Storage bucket for evidence images.
-- (Create it in the Supabase dashboard: Storage > New bucket
--  name = "evidence", Public = ON. Or run the line below.)
-- =============================================================
insert into storage.buckets (id, name, public)
values ('evidence', 'evidence', true)
on conflict (id) do nothing;

-- Bucket for re-hosted chat images (Discord CDN URLs expire ~24h, so we
-- copy each chat image here for permanent storage).
insert into storage.buckets (id, name, public)
values ('chat-images', 'chat-images', true)
on conflict (id) do nothing;
