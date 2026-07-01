-- 스킬업 인증 버튼이 게시될 디스코드 채널. 설정 화면에서 선택하고, 그 채널에 인증 버튼을 올린다.
alter table public.app_config
  add column if not exists cert_channel_id text;
