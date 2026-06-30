-- 제네릭 확장: 멤버 로스터(닉+attributes) · 공지 · 주간 리셋 + 폼 시드 갱신
-- 메이플 특정 필드(직급/보공/길드스킬 등)는 스키마에 박지 않고 members.attributes(jsonb)에 둔다.

-- ---------- members (길드 로스터; 사이트 로그인 users 와 분리) ----------
create table if not exists public.members (
  id          uuid primary key default gen_random_uuid(),
  nick        text unique not null,
  attributes  jsonb not null default '{}',   -- rank, job, level, combat stats, guild skills 등 도메인 데이터
  active      boolean not null default true,
  created_by  text,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
create index if not exists members_nick_idx on public.members(nick);

-- ---------- notices (제네릭 공지/안내) ----------
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

-- ---------- 주간 인증 리셋 기준 시각 ----------
alter table public.app_config add column if not exists weekly_reset_at timestamptz;

alter table public.members enable row level security;
alter table public.notices enable row level security;

-- ---------- 폼 시드 갱신: 가입 신청(디자인 필드) ----------
update public.forms
set fields = '[
  {"name":"discord","label":"디스코드","type":"text"},
  {"name":"nick","label":"닉네임","type":"text","required":true},
  {"name":"job","label":"직업","type":"text"},
  {"name":"level","label":"레벨","type":"number"},
  {"name":"route","label":"가입 경로","type":"select","options":["friend","community","ingame","etc"]},
  {"name":"intro","label":"각오 한마디","type":"textarea"}
]'::jsonb,
    on_approve = '{"registerMember":{"nickField":"nick","attrFields":{"job":"job","level":"level"},"defaults":{"rank":"일반길드원"}}}'::jsonb,
    submit_min_tier = 'guest',
    updated_at = now()
where key = 'join';

-- ---------- 폼 시드: 길드 스킬 인증 (스킬 포인트 폼 대체) ----------
delete from public.forms where key = 'skill_points';

insert into public.forms (key, title, description, fields, intake, submit_min_tier, requires_approval, on_approve, sort)
values (
  'skill_cert', '길드 스킬 인증', '길드 스킬을 올린 뒤 스크린샷과 함께 인증을 제출하세요.',
  '[
    {"name":"nick","label":"닉네임","type":"text","required":true},
    {"name":"skill","label":"스킬 종류","type":"select","required":true,"options":["boss","ignore","attack","exp","accuracy"]},
    {"name":"count","label":"인증 횟수","type":"number","required":true},
    {"name":"evidence","label":"스크린샷","type":"image","required":true},
    {"name":"memo","label":"메모","type":"textarea"}
  ]'::jsonb,
  'web', 'member', true,
  '{"incrementMemberSkill":{"nickField":"nick","skillField":"skill","countField":"count","max":20}}'::jsonb,
  1
)
on conflict (key) do update set
  title = excluded.title, description = excluded.description, fields = excluded.fields,
  on_approve = excluded.on_approve, updated_at = now();
