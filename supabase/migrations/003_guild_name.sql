-- 대시보드 배너 등에서 길드 이름 표시용. setup 저장 시 채워짐.
alter table public.app_config add column if not exists guild_name text;
