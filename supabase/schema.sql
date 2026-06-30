-- =============================================================
-- hddiscord — Supabase schema (공통 폼 시스템)
-- Run in the Supabase SQL editor. Server uses service_role (bypasses RLS).
-- =============================================================

-- ---------- users ----------
create table if not exists public.users (
  discord_id      text primary key,
  username        text not null,
  global_name     text,
  avatar          text,
  roles           text[] not null default '{}',
  tier            text not null default 'guest',   -- admin | reviewer | member | guest
  total_points    integer not null default 0,
  member_status   text not null default 'none',    -- none | applied | approved | rejected
  character_name  text,                            -- 메이플 캐릭터명 (프로필)
  level           integer,                         -- 캐릭터 레벨
  job             text,                            -- 직업
  joined_at       timestamptz,
  last_login      timestamptz,
  created_at      timestamptz not null default now()
);

-- ---------- forms (동적 폼 정의) ----------
-- 가입신청, 스킬포인트 인증 등 모든 "양식"을 데이터로 정의.
create table if not exists public.forms (
  id                uuid primary key default gen_random_uuid(),
  key               text unique not null,            -- slug: join, skill_points, ...
  title             text not null,
  description       text,
  fields            jsonb not null default '[]',     -- [{name,label,type,required,options?}]
  intake            text not null default 'web',     -- web | discord
  discord_channel_id text,                            -- intake=discord 일 때 수집 채널
  submit_min_tier   text not null default 'member',  -- guest | member | reviewer | admin
  requires_approval boolean not null default true,
  on_approve        jsonb not null default '{}',     -- {grantRoleId?, awardPointsField?, awardPointsFixed?}
  active            boolean not null default true,
  sort              integer not null default 0,
  created_by        text,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

-- ---------- form_submissions (제출/검토) ----------
create table if not exists public.form_submissions (
  id                uuid primary key default gen_random_uuid(),
  form_id           uuid not null references public.forms(id) on delete cascade,
  form_key          text not null,
  user_id           text,                            -- discord id (may be a non-site user for discord intake)
  answers           jsonb not null default '{}',     -- {fieldName: value}
  status            text not null default 'pending', -- pending | approved | rejected
  source            text not null default 'web',     -- web | discord
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

-- ---------- point_ledger ----------
create table if not exists public.point_ledger (
  id              uuid primary key default gen_random_uuid(),
  user_id         text not null references public.users(discord_id) on delete cascade,
  delta           integer not null,
  reason          text not null,
  source_type     text,                            -- 'form_submission' | 'manual'
  source_id       uuid,
  created_by      text references public.users(discord_id),
  created_at      timestamptz not null default now()
);
create index if not exists ledger_user_idx on public.point_ledger(user_id, created_at desc);

-- ---------- poll_cursor (디스코드 증분 수집) ----------
create table if not exists public.poll_cursor (
  channel_id        text primary key,
  last_message_id   text,
  updated_at        timestamptz not null default now()
);

-- ---------- app_config (디스코드 연동 설정 · /setup) ----------
create table if not exists public.app_config (
  id                text primary key default 'default',
  guild_id          text,
  guild_name        text,
  notify_channel_id text,
  admin_role_ids    text[] not null default '{}',
  reviewer_role_ids text[] not null default '{}',
  member_role_ids   text[] not null default '{}',
  setup_completed   boolean not null default false,
  weekly_reset_at   timestamptz,
  updated_by        text,
  updated_at        timestamptz not null default now()
);

-- ---------- members (길드 로스터; 로그인 users 와 분리) ----------
-- 메이플 특정 필드(직급/직업/레벨/전투정보/길드스킬)는 attributes(jsonb)에 둔다.
create table if not exists public.members (
  id          uuid primary key default gen_random_uuid(),
  nick        text unique not null,
  attributes  jsonb not null default '{}',
  active      boolean not null default true,
  created_by  text,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
create index if not exists members_nick_idx on public.members(nick);

-- ---------- notices (제네릭 공지) ----------
create table if not exists public.notices (
  id          uuid primary key default gen_random_uuid(),
  title       text not null,
  body        text not null default '',
  notice_date date,
  active      boolean not null default true,
  sort        integer not null default 0,
  created_by  text,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
create index if not exists notices_active_idx on public.notices(active, sort, created_at desc);

-- ---------- audit_log ----------
create table if not exists public.audit_log (
  id              uuid primary key default gen_random_uuid(),
  actor_id        text references public.users(discord_id),
  action          text not null,
  target_type     text,
  target_id       text,
  detail          jsonb,
  created_at      timestamptz not null default now()
);
create index if not exists audit_created_idx on public.audit_log(created_at desc);

-- =============================================================
-- RLS (no public policies; server uses service_role)
-- =============================================================
alter table public.users enable row level security;
alter table public.forms enable row level security;
alter table public.form_submissions enable row level security;
alter table public.point_ledger enable row level security;
alter table public.poll_cursor enable row level security;
alter table public.app_config enable row level security;
alter table public.audit_log enable row level security;
alter table public.members enable row level security;
alter table public.notices enable row level security;

insert into public.app_config (id) values ('default') on conflict (id) do nothing;

-- =============================================================
-- Storage buckets
-- =============================================================
insert into storage.buckets (id, name, public) values ('evidence', 'evidence', true)
on conflict (id) do nothing;
insert into storage.buckets (id, name, public) values ('chat-images', 'chat-images', true)
on conflict (id) do nothing;

-- =============================================================
-- Seed default forms (가입신청 / 스킬포인트 인증)
-- =============================================================
insert into public.forms (key, title, description, fields, intake, submit_min_tier, on_approve, sort)
values
(
  'join', '가입 신청서', '길드 가입을 신청합니다.',
  '[
    {"name":"discord","label":"디스코드","type":"text"},
    {"name":"nick","label":"닉네임","type":"text","required":true},
    {"name":"job","label":"직업","type":"text"},
    {"name":"level","label":"레벨","type":"number"},
    {"name":"route","label":"가입 경로","type":"select","options":["friend","community","ingame","etc"]},
    {"name":"intro","label":"각오 한마디","type":"textarea"}
  ]'::jsonb,
  'web', 'guest',
  '{"registerMember":{"nickField":"nick","attrFields":{"job":"job","level":"level"},"defaults":{"rank":"일반길드원"}}}'::jsonb, 0
),
(
  'skill_cert', '길드 스킬 인증', '길드 스킬을 올린 뒤 스크린샷과 함께 인증을 제출하세요.',
  '[
    {"name":"nick","label":"닉네임","type":"text","required":true},
    {"name":"skill","label":"스킬 종류","type":"select","required":true,"options":["boss","ignore","attack","exp","accuracy"]},
    {"name":"count","label":"인증 횟수","type":"number","required":true},
    {"name":"evidence","label":"스크린샷","type":"image","required":true},
    {"name":"memo","label":"메모","type":"textarea"}
  ]'::jsonb,
  'web', 'member',
  '{"incrementMemberSkill":{"nickField":"nick","skillField":"skill","countField":"count","max":20}}'::jsonb, 1
)
on conflict (key) do nothing;
