# Claude Design 프롬프트 (디자인 시스템 기보유 버전)

아래 블록을 그대로 Claude Design에 붙여넣으세요. (이미 만든 디자인 시스템을 재사용하도록 지시되어 있음)
화면 상세 IA는 [FRONTEND_BRIEF.md](FRONTEND_BRIEF.md), API 계약은 [API.md](API.md) 참고.

---

```
# 역할
너는 시니어 프로덕트 디자이너 겸 프론트엔드 개발자다. "디스코드 연동 길드 관리" 웹앱의
화면을 설계하고 구현한다. 백엔드는 이미 완성되어 있으니, 너는 프론트엔드만 만든다.

# 가장 중요한 제약: 기존 디자인 시스템을 그대로 사용
- 이 프로젝트에는 이미 구축된 디자인 시스템(컬러 토큰, 타이포, 간격, 버튼/카드/배지/입력/
  테이블/모달/토스트 등 컴포넌트)이 있다. 새 비주얼 언어를 만들지 말고 기존 컴포넌트·토큰을
  최대한 재사용한다. 시스템에 없는 패턴이 필요하면 기존 스타일에 맞춰 최소한으로 확장한다.
- 한국어 UI. 데스크톱 우선 + 모바일 반응형.

# 제품 요약
디스코드 길드의 (1) 가입 신청 (2) 스킬 포인트 등 각종 "폼" 제출과 (3) 운영자 검토 승인/반려,
(4) 멤버·포인트 관리 (5) 통계 를 제공하는 웹앱. 로그인은 디스코드 OAuth.

# 사용자 등급 (백엔드가 부여, 화면 게이팅 기준)
admin > reviewer(운영자) > member > guest
- guest: 로그인만 한 상태(서버 미참여/무역할) — 가입 신청만 가능
- member: 서버 참여 + 역할 보유 — 일반 폼 제출 가능
- reviewer: 검토·멤버·통계
- admin: 폼/설정까지 (서버 소유자·관리자)

# 기술 전제 (백엔드는 이미 구현됨)
- Next.js App Router + TypeScript. 스타일링은 위 디자인 시스템을 따른다.
- 데이터는 같은 출처 REST API(/api/v1/*), 쿠키 세션 인증. CORS/토큰 불필요.
  fetch("/api/v1/...", { credentials: "same-origin" }) 로 호출.
- 응답 형식: 성공 { ok:true, data }, 실패 { ok:false, error:{ code, message } }.
  ok=false면 error.message를 토스트로. 401→로그인 유도, 403→"권한 없음".
- 로그인/로그아웃: next-auth/react 의 signIn("discord") / signOut().
- 현재 사용자·등급: GET /api/v1/me → { discordId, name, avatar, tier, isAdmin, roles, memberStatus, totalPoints }.
- 메뉴/라우트는 tier로 게이팅하되, 보안은 서버가 책임지므로 UI는 "숨김" 수준이면 된다.

# 공통 UX 규칙
- 모든 목록/상세는 로딩·빈 상태·에러 상태를 갖춘다.
- 제출/승인/반려 등 액션은 낙관적 토스트 + 목록 즉시 갱신.
- 상태 배지: 대기(주의색)/승인(성공색)/반려(위험색) — 디자인 시스템 배지 사용.
- 상단 내비: 좌측 로고, 등급별 메뉴, 우측 사용자(이름+등급 배지)+로그아웃.
- setupCompleted=false이고 admin/소유자면 상단에 "초기 설정" 배너.

# 화면 (정보구조)
공통(member↑): 대시보드 · 폼 제출 · 내 제출내역
reviewer↑ 추가: 검토 큐 · 멤버 · 통계
admin 추가: 폼 빌더 · 설정

라우트:
/login                      디스코드 로그인
/                           대시보드
/join                       가입 신청 (Phase1 고정 폼)
/skills                     스킬 포인트 인증 (Phase1 고정 폼)
/me/submissions             내 제출내역
/review                     검토 큐 (reviewer+)
/members, /members/[id]     멤버 목록/상세 (reviewer+)
/stats                      통계 (reviewer+)
/setup                      디스코드 연동 설정 (admin/소유자)
/admin/forms (Phase2)       폼 빌더

# Phase 1 — 먼저 구현 (알려진 폼 2개를 "고정 화면"으로)
1) /login: 디스코드 로그인 버튼 1개 + 간단한 서비스 소개.
2) / 대시보드: 내 등급/멤버상태/보유 포인트 요약 카드, "가입 신청"·"스킬 인증" 바로가기,
   최근 내 제출 3~5건. (admin/소유자면 설정 미완료 배너) — /api/v1/me, /api/v1/submissions/mine, /api/v1/config
3) /join 가입 신청: 입력 필드
   - character_name (캐릭터명, 필수, text)
   - playtime (플레이 시간대, text)
   - referral (가입 경로, text)
   - introduction (자기소개, textarea)
   제출 → POST /api/v1/forms/join/submissions (multipart/form-data, 필드명 그대로).
   guest도 제출 가능. 대기중 중복 제출은 409 → "이미 검토 대기 중" 안내.
4) /skills 스킬 포인트 인증: 입력 필드
   - skill (스킬/항목, 필수, text)
   - points (포인트, 필수, number)
   - note (설명, textarea)
   - evidence (증빙 이미지, 파일, 선택, 5MB↓)
   제출 → POST /api/v1/forms/skill_points/submissions (multipart, evidence=파일).
   member 이상만. 상단에 내 보유 포인트 표시.
5) /me/submissions: 내 모든 제출 리스트(폼 제목, 제출일, 상태 배지, 반려 사유, 증빙 링크).
   GET /api/v1/submissions/mine.
6) /review 검토 큐 (reviewer+): 필터 바(폼 종류 / 상태(기본 pending) / 소스 web·discord).
   각 제출 카드: 제출자, 내용(answers), 이미지 있으면 썸네일. [승인][반려] + 사유 입력.
   GET /api/v1/submissions?status=pending&formKey=&source= , POST /api/v1/submissions/{id}/review { decision:"approved"|"rejected", note }.
   ※ source=discord 항목은 수집된 채팅(answers.content / answers.image_url / answers.author_name) 표시.
7) /members (reviewer+): 표(멤버, 등급, 상태, 포인트, 최근로그인), 정렬(포인트/최근).
   GET /api/v1/members?sort=points|recent. 행 클릭 → /members/[discordId]:
   프로필 + 포인트 변동 내역, admin이면 포인트 수동 조정 폼(POST /api/v1/members/{id}/points {delta,reason}).
8) /stats (reviewer+): KPI 카드(전체/가입 멤버, 대기 제출, 누적 포인트, 활성 폼) +
   차트(포인트 상위 막대, 제출 상태 도넛). GET /api/v1/stats.
9) /setup (admin/소유자): 감지된 서버 표시, 알림 채널 선택(드롭다운),
   역할→등급 매핑(권한 기반 추천값 미리 선택), 저장. 저장 후 "다시 로그인" 안내.
   GET /api/v1/setup/options, PUT /api/v1/setup { guildId, notifyChannelId, roleTiers:{roleId:"admin|reviewer|member|none"} }.

# Phase 2 — 이후 (제네릭 폼, 지금은 설계만/후순위)
- /forms 동적 폼 목록 + /forms/[key] 폼 정의의 fields대로 입력 UI를 동적 렌더.
- /admin/forms 폼 빌더: 필드 추가/삭제/정렬·타입·필수·옵션, intake(web/discord+채널),
  submitMinTier, requiresApproval, onApprove(역할부여/포인트적립). API: /api/v1/forms*, /api/v1/discord/meta.
- 백엔드는 이미 제네릭하므로, Phase1의 /join·/skills 도 내부적으로 같은 API(/forms/{key}/submissions)를
  쓴다. 즉 Phase2는 "동적 렌더"만 추가하면 되고 백엔드 변경은 없다.

# 산출물 (순서)
1) 먼저, 위 화면들을 "기존 디자인 시스템의 어떤 컴포넌트로 구성할지" 매핑한 화면·컴포넌트 인벤토리를 제시.
2) 승인받으면 Phase 1 화면을 하나씩 — 시안 + 동작하는 코드(로딩/빈/에러 상태 포함) — 로 구현.
3) 공통 요소(내비게이션, 토스트, 상태 배지, 폼 입력)부터 만들고 화면에서 재사용.
```

---

> 참고: Phase 1의 `/join`, `/skills`는 표면은 "고정 폼"이지만 호출하는 API는 제네릭(`/forms/{key}/submissions`)이라,
> 나중에 폼 빌더(Phase 2)를 붙여도 백엔드 변경이 전혀 없습니다.
