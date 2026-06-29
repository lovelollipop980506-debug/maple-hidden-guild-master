# HD Guild — 프론트엔드 설계 브리프 (IA + Claude Design 프롬프트)

백엔드(공통 폼 시스템)는 완성됨. 이 문서는 **화면 IA**와 **Claude Design에 넣을 프롬프트**.
API 계약: [API.md](API.md). 프론트는 **같은 Next.js 앱**의 `src/app/`에 추가(쿠키 세션, `fetch("/api/v1/...")`).

---

## 1. 정보 구조 (IA)

### 화면 트리
```
/login                      비로그인 → Discord 로그인
/                           대시보드 (로그인 후)
/forms                      제출 가능한 폼 목록
/forms/[key]                폼 제출 (동적 렌더)
/me/submissions             내 제출 내역
─ 운영(reviewer+) ─
/review                     검토 큐 (폼/상태/source 필터, 승인·반려)
/members                    멤버 목록
/members/[discordId]        멤버 상세 (포인트 내역 / 수동조정[admin])
/stats                      통계 대시보드
─ 관리(admin) ─
/admin/forms               폼 빌더 (목록)
/admin/forms/new           폼 생성
/admin/forms/[key]/edit    폼 편집
/setup                     디스코드 연동 설정 (부트스트랩)
```

### 내비게이션 (등급별 노출)
- **공통(member↑)**: 대시보드 · 폼 · 내 제출
- **reviewer↑ 추가**: 검토 큐 · 멤버 · 통계
- **admin 추가**: 폼 빌더 · 설정
- 우상단: 로그인 사용자(이름·등급 배지)·로그아웃. 등급은 `GET /api/v1/me`로 판정.
- `setupCompleted=false`이고 소유자/관리권한자면 상단에 "초기 설정" 배너.

### 화면별 목적 / 핵심 요소 / API
| 화면 | 목적 | 핵심 요소 | API |
|---|---|---|---|
| `/login` | 로그인 | Discord 버튼 | `signIn('discord')` |
| `/` 대시보드 | 내 현황 한눈 | 등급·멤버상태·포인트 카드, 제출가능 폼 바로가기, 최근 제출, (조건)설정 배너 | `/me`, `/forms`, `/me/submissions`, `/config` |
| `/forms` | 폼 고르기 | 폼 카드(제목/설명), 제출권한 없는 폼은 잠금표시 | `/forms` |
| `/forms/[key]` | 제출 | **동적 폼**: fields 타입별 입력(text/textarea/number/select/checkbox/image), 제출 | `/forms/{key}`, `POST /forms/{key}/submissions` (multipart) |
| `/me/submissions` | 내 내역 | 제출 리스트 + 상태배지(대기/승인/반려)+사유 | `/submissions/mine` |
| `/review` | 검토 | 필터(폼/상태/source web·discord), 카드(answers·이미지), 승인/반려+사유 | `/submissions`, `POST /submissions/{id}/review` |
| `/members` | 멤버 | 표(등급/포인트/상태), 정렬 | `/members` |
| `/members/[id]` | 멤버 상세 | 프로필+포인트 변동내역, [admin]포인트 조정 | `/members/{id}`, `POST /members/{id}/points` |
| `/stats` | 통계 | KPI 카드 + 차트(포인트 상위 막대, 제출상태 도넛) | `/stats` |
| `/admin/forms` | 폼 관리 | 폼 목록(활성토글), 새 폼 | `/forms?all=1`, `DELETE /forms/{key}` |
| `/admin/forms/new`·`[key]/edit` | 폼 빌더 | 메타(제목·설명·key)·**필드 편집기**(추가/삭제/타입/필수/옵션)·intake(web/discord+채널)·submitMinTier·requiresApproval·onApprove(역할/포인트필드) | `POST/PUT /forms`, `/discord/meta` |
| `/setup` | 연동 설정 | 감지 서버, 알림채널 선택, 역할→등급 매핑(권한기반 추천) | `/setup/options`, `PUT /setup` |

### 상태/권한 UX 규칙
- 모든 데이터 호출은 `{ok,data|error}` 포장 → `ok=false`면 `error.message` 토스트.
- `401`→로그인 유도, `403`→"권한 없음" 안내. 메뉴는 `me.tier` 기준으로 숨김(이중 방어).
- 폼 제출 성공/실패, 검토 승인/반려는 토스트 + 목록 즉시 갱신.

---

## 2. Claude Design 프롬프트 (복사해서 사용)

```
역할: 너는 시니어 프로덕트 디자이너 겸 프론트엔드 개발자다. 아래 백엔드가 이미 완성된
"디스코드 연동 길드 관리" 웹앱의 프론트엔드를 Next.js(App Router)로 디자인·구현한다.

[기술 제약]
- Next.js App Router, TypeScript, Tailwind CSS. 기존 Next.js 프로젝트의 src/app/ 에 페이지 추가.
- 백엔드는 같은 출처의 REST API(/api/v1/*), 쿠키 세션 인증. CORS/토큰 불필요.
  모든 데이터는 fetch("/api/v1/...", { credentials:"same-origin" })로 호출.
- 응답 형식: 성공 { ok:true, data }, 실패 { ok:false, error:{ code,message } }.
- 로그인: next-auth/react의 signIn("discord") / signOut(). 현재 사용자/등급은 GET /api/v1/me.
- 등급(tier): admin > reviewer > member > guest. 메뉴/화면은 등급으로 게이팅.

[디자인 방향]
- 디스코드 감성의 다크 테마. 컬러: blurple #5865F2, 패널 #2b2d31, 배경 #1e1f22, 텍스트 zinc.
- 한국어 UI. 깔끔한 관리자 대시보드 톤. 데스크톱 우선 + 모바일 반응형.
- 컴포넌트: 카드, 표, 상태 배지(대기=amber/승인=emerald/반려=red), 토스트, 모달, 빈 상태.

[정보구조 / 화면]  ← (이 문서 1번 IA의 화면 트리·표를 그대로 붙여넣기)

[핵심 동작]
1. 동적 폼 렌더: GET /api/v1/forms/{key}의 fields(name,label,type,required,options)대로 입력 UI를
   생성. type: text/textarea/number/select/checkbox/image. 제출은 multipart/form-data로
   POST /api/v1/forms/{key}/submissions (image 필드는 파일첨부).
2. 검토 큐: GET /api/v1/submissions(필터 formKey/status/source). source=discord 항목은
   수집된 채팅(answers.content/image_url/author_name) 표시. 승인/반려는
   POST /api/v1/submissions/{id}/review { decision, note }.
3. 폼 빌더(admin): 필드를 추가/삭제/정렬하고 타입·필수·옵션 편집. intake=discord면 채널 선택
   (GET /api/v1/discord/meta). onApprove로 역할부여(역할 선택) 또는 포인트적립(필드 선택) 지정.
   저장은 POST/PUT /api/v1/forms.
4. 설정/부트스트랩: GET /api/v1/setup/options로 서버·채널·역할(추천등급) 받아 매핑 UI 구성,
   PUT /api/v1/setup 저장. 저장 후 "다시 로그인" 안내.

[산출물]
- 각 화면별 페이지 컴포넌트(서버/클라이언트 적절히 분리), 공통 UI 컴포넌트, 내비게이션,
  로딩/에러/빈 상태 처리. 디자인 시안과 실제 동작 코드 모두.
- 먼저 전체 화면 IA와 컴포넌트 목록을 제시하고, 그 다음 화면 단위로 구현.
```

> 위 프롬프트의 `[정보구조 / 화면]` 자리에 이 문서 1번의 화면 트리와 화면별 표를 붙여넣으면 됩니다.
