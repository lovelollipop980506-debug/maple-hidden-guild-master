-- 디스코드 계정 차단: 거절(reject)과 별개로, 해당 계정의 가입 신청 자체를 막는다.
alter table public.users
  add column if not exists blocked        boolean not null default false,
  add column if not exists blocked_reason text,
  add column if not exists blocked_by     text,
  add column if not exists blocked_at     timestamptz;
