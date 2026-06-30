-- 가입 신청서 필드 개편: 닉네임 · 레벨 · 직업 · 스공 · 보공 · 방무 · 접속 시간대
-- 002_forms.sql 시드는 on conflict do nothing 이라 이미 존재하는 'join' 폼은 갱신되지 않는다.
-- 따라서 명시적 UPDATE 로 라이브 폼의 fields 스키마를 교체한다.
-- 접속 시간대(playtime)는 "평일 새벽, 주말 오후"처럼 선택 슬롯을 합친 문자열로 저장.
update public.forms
set fields = '[
    {"name":"nick","label":"닉네임","type":"text","required":true},
    {"name":"level","label":"레벨","type":"number"},
    {"name":"job","label":"직업","type":"text"},
    {"name":"stat_attack","label":"스공","type":"number"},
    {"name":"boss","label":"보공","type":"number"},
    {"name":"ignore","label":"방무","type":"number"},
    {"name":"playtime","label":"접속 시간대","type":"text"}
  ]'::jsonb
where key = 'join';
