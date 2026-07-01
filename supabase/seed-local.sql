-- 로컬 전용 샘플 데이터 (프로덕션 아님). supabase stop 하면 사라짐.
begin;

-- 멤버(users) — 디스코드 역할 보유(roles non-empty) + 서버 닉
insert into public.users (discord_id, username, global_name, guild_nick, tier, roles, character_name, job, level, member_status, joined_at, last_login)
values
 ('900000000000000001','poro','뽀로로','뽀로로', 'reviewer', '{"role_a"}', '뽀로로', '히어로',   250, 'approved', now() - interval '40 days', now()),
 ('900000000000000002','crong','crong_dc','크롱',  'member',   '{"role_a"}', null,      '나이트로드', 248, 'approved', now() - interval '30 days', now()),
 ('900000000000000003','loopy','LOOPY','루피',      'member',   '{"role_a"}', '루피',    '비숍',     245, 'approved', now() - interval '22 days', now()),
 ('900000000000000004','eddy','에디','에디',         'member',   '{"role_a"}', null,      '보우마스터', 252, 'approved', now() - interval '15 days', now()),
 ('900000000000000005','petty','petty','포비',       'member',   '{"role_a"}', '포비',    '팔라딘',   240, 'approved', now() - interval '8 days',  now())
on conflict (discord_id) do nothing;

-- 승인된 스킬업 인증 → 누적/이번 주 집계
insert into public.form_submissions (form_id, form_key, user_id, answers, status, source, reviewer_id, reviewed_at, created_at)
select f.id, 'skill_cert', v.uid,
       jsonb_build_object('nick', v.nick, 'skill', v.skill, 'count', v.cnt, 'author_name', v.nick),
       'approved', v.src, '900000000000000001', v.ts, v.ts
from public.forms f
cross join (values
  ('900000000000000001','뽀로로','boss',   4, 'discord', now() - interval '2 days'),
  ('900000000000000001','뽀로로','ignore', 3, 'discord', now() - interval '35 days'),
  ('900000000000000002','크롱','attack',  5, 'discord', now() - interval '1 days'),
  ('900000000000000002','크롱','boss',    2, 'manual',  now() - interval '20 days'),
  ('900000000000000003','루피','exp',     6, 'discord', now() - interval '3 days'),
  ('900000000000000004','에디','accuracy',3, 'discord', now() - interval '10 days'),
  ('900000000000000004','에디','boss',    5, 'manual',  now() - interval '4 days'),
  ('900000000000000005','포비','ignore',  2, 'discord', now() - interval '12 days')
) as v(uid, nick, skill, cnt, src, ts)
where f.key = 'skill_cert';

-- 검토 대기: 스킬업 인증 1건
insert into public.form_submissions (form_id, form_key, user_id, answers, status, source, created_at)
select f.id, 'skill_cert', '900000000000000003',
       jsonb_build_object('nick','루피','skill','boss','count',3,'author_name','루피'),
       'pending', 'discord', now() - interval '2 hours'
from public.forms f where f.key='skill_cert';

-- 검토 대기: 가입 신청 1건 (신청자도 users에 있어야 닉 표시)
insert into public.users (discord_id, username, global_name, guild_nick, tier, roles, member_status, last_login)
values ('900000000000000009','newbie','뉴비까까','까까', 'guest', '{}', 'applied', now())
on conflict (discord_id) do nothing;

insert into public.form_submissions (form_id, form_key, user_id, answers, status, source, created_at)
select f.id, 'join', '900000000000000009',
       jsonb_build_object('nick','까까','level',232,'job','섀도어','stat_attack',95000,'boss',185,'ignore',72,'playtime','평일 저녁, 주말 오후'),
       'pending', 'web', now() - interval '5 hours'
from public.forms f where f.key='join';

-- 공지
insert into public.notices (title, body, notice_date, active, sort, created_by)
values
 ('주간 보스 레이드 안내','금요일 저녁 9시에 길드 보스 레이드를 진행합니다. 인증 채널에서 참여 체크해 주세요.', current_date, true, 2, '900000000000000001'),
 ('스킬업 인증 규칙 변경','이번 주부터 인증은 디스코드 인증 채널의 버튼으로만 받습니다.', current_date - 3, true, 1, '900000000000000001'),
 ('신규 길드원 환영','이번 주 새로 들어온 길드원들 환영합니다! 궁금한 건 운영진에게 편하게 물어보세요.', current_date - 7, true, 0, '900000000000000001');

-- 운영 로그(audit_log) 샘플
insert into public.audit_log (actor_id, action, target_type, target_id, detail, created_at)
values
 ('900000000000000001','submission.approved','form_submission', gen_random_uuid()::text, '{"form":"skill_cert"}', now() - interval '1 days'),
 ('900000000000000001','member.cert_add','user','900000000000000004', '{"nick":"에디","skill":"boss","count":5}', now() - interval '4 days'),
 ('900000000000000001','user.block','user','900000000000000009', '{"nick":"까까","reason":"중복 계정"}', now() - interval '6 days'),
 ('900000000000000001','user.unblock','user','900000000000000009', '{"nick":"까까"}', now() - interval '5 days'),
 ('900000000000000001','setup.save','app_config','1505850142169759817', '{}', now() - interval '38 days');

commit;
