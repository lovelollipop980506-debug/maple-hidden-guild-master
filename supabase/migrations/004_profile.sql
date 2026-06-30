-- 메이플 캐릭터 프로필(캐릭터명/레벨/직업) — 대시보드·멤버 목록 표시용.
-- 가입 폼 승인 시 answers에서 동기화되며, 본인이 직접 수정도 가능(PUT /api/v1/me/profile).

alter table public.users
  add column if not exists character_name text,
  add column if not exists level integer,
  add column if not exists job text;

-- 가입 폼에 직업/레벨 필드 추가
update public.forms
set fields = '[
  {"name":"character_name","label":"캐릭터명","type":"text","required":true},
  {"name":"job","label":"직업","type":"text"},
  {"name":"level","label":"레벨","type":"number"},
  {"name":"playtime","label":"플레이 시간대","type":"text"},
  {"name":"referral","label":"가입 경로","type":"text"},
  {"name":"introduction","label":"자기소개","type":"textarea"}
]'::jsonb,
    updated_at = now()
where key = 'join';
