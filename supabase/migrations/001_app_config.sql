-- Migration: app_config (디스코드 연동 설정을 .env -> DB 로 이전)
-- 이미 DB가 있는 경우 이 파일을 Supabase SQL Editor 에서 실행하세요.

create table if not exists public.app_config (
  id                      text primary key default 'default',
  guild_id                text,
  source_channel_ids      text[] not null default '{}',
  notify_channel_id       text,
  approved_member_role_id text,
  admin_role_ids          text[] not null default '{}',
  reviewer_role_ids       text[] not null default '{}',
  member_role_ids         text[] not null default '{}',
  setup_completed         boolean not null default false,
  updated_by              text,
  updated_at              timestamptz not null default now()
);

alter table public.app_config enable row level security;

-- 단일 설정 행 보장
insert into public.app_config (id) values ('default') on conflict (id) do nothing;
