-- Migration: 공통 폼 시스템으로 전환
-- applications / skill_verifications / messages -> forms + form_submissions
-- (아직 운영 데이터가 없다는 전제. 있으면 백업 후 실행)

-- 1) 구 기능 테이블 제거
drop table if exists public.applications cascade;
drop table if exists public.skill_verifications cascade;
drop table if exists public.messages cascade;

-- 2) app_config 정리 (소스채널/가입역할은 폼으로 이동)
alter table public.app_config drop column if exists source_channel_ids;
alter table public.app_config drop column if exists approved_member_role_id;

-- 3) forms
create table if not exists public.forms (
  id                uuid primary key default gen_random_uuid(),
  key               text unique not null,
  title             text not null,
  description       text,
  fields            jsonb not null default '[]',
  intake            text not null default 'web',
  discord_channel_id text,
  submit_min_tier   text not null default 'member',
  requires_approval boolean not null default true,
  on_approve        jsonb not null default '{}',
  active            boolean not null default true,
  sort              integer not null default 0,
  created_by        text,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

-- 4) form_submissions
create table if not exists public.form_submissions (
  id                uuid primary key default gen_random_uuid(),
  form_id           uuid not null references public.forms(id) on delete cascade,
  form_key          text not null,
  user_id           text,
  answers           jsonb not null default '{}',
  status            text not null default 'pending',
  source            text not null default 'web',
  discord_message_id text,
  reviewer_id       text references public.users(discord_id),
  review_note       text,
  reviewed_at       timestamptz,
  created_at        timestamptz not null default now()
);
create index if not exists subs_form_status_idx on public.form_submissions(form_id, status, created_at desc);
create index if not exists subs_user_idx on public.form_submissions(user_id);
create unique index if not exists subs_discord_msg_uidx
  on public.form_submissions(discord_message_id) where discord_message_id is not null;

alter table public.forms enable row level security;
alter table public.form_submissions enable row level security;

-- 5) 기본 폼 시드
insert into public.forms (key, title, description, fields, intake, submit_min_tier, on_approve, sort)
values
(
  'join', '가입 신청서', '길드 가입을 신청합니다.',
  '[
    {"name":"character_name","label":"캐릭터명","type":"text","required":true},
    {"name":"playtime","label":"플레이 시간대","type":"text"},
    {"name":"referral","label":"가입 경로","type":"text"},
    {"name":"introduction","label":"자기소개","type":"textarea"}
  ]'::jsonb,
  'web', 'guest', '{}'::jsonb, 0
),
(
  'skill_points', '스킬 포인트 인증', '기록을 제출하고 승인을 받습니다.',
  '[
    {"name":"skill","label":"스킬/항목","type":"text","required":true},
    {"name":"points","label":"포인트","type":"number","required":true},
    {"name":"note","label":"설명","type":"textarea"},
    {"name":"evidence","label":"증빙 이미지","type":"image"}
  ]'::jsonb,
  'web', 'member', '{"awardPointsField":"points"}'::jsonb, 1
)
on conflict (key) do nothing;
