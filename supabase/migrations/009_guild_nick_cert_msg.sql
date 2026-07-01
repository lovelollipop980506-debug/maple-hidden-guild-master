-- 히든 서버 닉네임(길드 멤버 nick) 저장 + 스킬업 인증 버튼 메시지 문구 저장
alter table public.users
  add column if not exists guild_nick text;         -- 운영 길드에서의 서버 닉네임(로그인 시 갱신)

alter table public.app_config
  add column if not exists cert_message text;        -- 인증 채널 버튼 메시지(제목/본문) 편집용
