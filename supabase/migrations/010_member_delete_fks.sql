-- 멤버 삭제 시 그 사람이 남긴 로그/검토 기록이 삭제를 막지 않도록 FK를 SET NULL 로.
-- (운영 로그·검토 이력은 보존하되 actor/reviewer 만 null 처리)
alter table public.audit_log drop constraint if exists audit_log_actor_id_fkey;
alter table public.audit_log
  add constraint audit_log_actor_id_fkey
  foreign key (actor_id) references public.users(discord_id) on delete set null;

alter table public.form_submissions drop constraint if exists form_submissions_reviewer_id_fkey;
alter table public.form_submissions
  add constraint form_submissions_reviewer_id_fkey
  foreign key (reviewer_id) references public.users(discord_id) on delete set null;
