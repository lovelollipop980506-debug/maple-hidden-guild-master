# HD Guild — 설계 및 의사결정 문서

디스코드와 연동되는 길드 관리 웹사이트. **무료 호스팅(Netlify + Supabase)** 기준으로 설계.

> 이 문서는 "왜 이렇게 만들었는가"를 기록하는 설계/결정 문서입니다.
> 실제 셋업·실행 방법은 [README.md](../README.md) 참고.

---

## 1. 목표

- 디스코드 길드(서버)를 운영하기 위한 웹 관리 도구.
- 로그인은 디스코드 계정으로만. 권한은 디스코드 역할(role)을 그대로 사이트 권한으로 사용.
- **비용이 발생하면 안 됨** → 전 구성 요소를 무료 티어 안에서 동작하도록 설계.

---

## 2. 핵심 제약과 호스팅 판단

### Netlify만으로는 부족 → 역할 분담
- Netlify는 **정적 프론트 + 짧은 서버리스 함수** 호스팅. 다음은 불가:
  - **상시 구동 프로세스** (디스코드 Gateway 봇) → 폴링 방식으로 회피.
  - **데이터베이스** → Supabase 사용.

### "상시 구동 봇" 대신 폴링
- 디스코드 채팅을 실시간으로 받으려면 원래 Gateway(WebSocket)에 상주하는 봇이 필요.
- 상시 구동을 빼기로 결정 → **Netlify Scheduled Function이 5분마다 REST API로 채널 메시지를 폴링**.
- 트레이드오프: "즉시"가 아니라 **최대 5분 지연**. 운영자 검토용이므로 허용.

### DB 선택: Netlify DB(❌ 무료 아님) vs Neon vs Supabase
| 선택지 | 무료? | 비고 |
|--------|-------|------|
| Netlify DB (통합) | ❌ | 크레딧 기반 유료 플랜 필요 |
| Neon 직접 | ✅ | 단 **100 CU-시간/월** → 잦은 폴링 시 compute 초과 위험 |
| **Supabase** | ✅ | **compute 시간 미과금** → 잦은 폴링/쓰기에 유리. 최종 채택 |

→ 잦은 폴링 시나리오에서 Neon은 compute-시간 한도가 먼저 터짐. **Supabase 채택.**

---

## 3. 무료 티어 한도 분석

### Netlify (무료 = 월 300 크레딧, 빌드+함수+대역폭 공유)
- 스케줄 함수: 10 크레딧/GB-시간, 기본 메모리 1GB, 최소 주기 1분.
- 폴링 주기별 월 함수 소비(1회 ~2초 가정):

| 주기 | 월 실행수 | 크레딧 | 판정 |
|------|----------|--------|------|
| 1분 | 43,200 | ~240 | ⚠️ 위험 |
| **5분** | 8,640 | ~48 | ✅ 채택 |
| 10분 | 4,320 | ~24 | ✅ |

### Supabase (무료)
- DB + Storage **1GB**, 전송 **5GB/월**.
- **compute 시간 미과금**, 7일 완전 무활동 시에만 일시정지(폴링이 매일 돌아 방지됨).
- 이미지 장당 ~500KB 기준 약 2,000장 보관 가능.

### 자동 과금 없음 (중요)
- Supabase/Netlify 무료 플랜은 **카드 없이 동작 → 한도 초과 시 청구가 아니라 일시 중단**.
- 구조상 "돈이 나갈" 일이 없음. + 아래 retention으로 용량 일정 유지 → **사실상 영구 무료**.

---

## 4. 아키텍처

```
[디스코드 채널] --5분 폴링(REST)--> [Netlify 예약함수] --> [Supabase: messages + Storage(이미지)]
                                                                   ↑
[사용자] --Discord OAuth--> [Next.js on Netlify] <--조회/관리--> [Supabase]
            로그인 시 역할 조회 → RBAC로 메뉴/기능 제어
[사이트 액션(승인/반려)] --> [알림] --DM 시도→채널 폴백--> [디스코드]
[매일 정리] --> [Netlify 예약함수 cleanup] --> 90일 지난 메시지/이미지 삭제
```

- 프론트+API: **Next.js (App Router)** on Netlify
- 인증: **Auth.js (NextAuth v5) + Discord OAuth**
- DB/스토리지: **Supabase**
- 백그라운드: **Netlify Scheduled Functions** 2개 (poll-messages 5분, cleanup 매일)

---

## 5. 기능 (6개)

| # | 기능 | 핵심 동작 | 접근 권한 |
|---|------|----------|-----------|
| 1 | 디스코드 로그인 | OAuth + 역할 조회 → 세션 | 전체 |
| 2 | 가입 신청서 | 작성/제출 → 운영자 승인·반려 → 알림 | 작성:로그인, 검토:운영자 |
| 3 | 스킬포인트 인증 | 증빙 이미지 제출 → 승인 시 포인트 적립 | 제출:멤버, 검토:운영자 |
| 4 | 멤버 관리 | 멤버 목록·등급·포인트·상태 | 운영자 |
| 5 | 통계 | KPI + 포인트 상위/신청 현황 차트 | 운영자 |
| 6 | 채팅 수집 | 채널 메시지 5분 폴링 → DB (이미지 영구 보존) | 검토:운영자 |

### 공통 승인 워크플로
- 신청서·스킬인증 모두 "제출 → 대기 → 승인/반려 → 알림" 동일 패턴.
- 승인 시: (신청서) 디스코드 역할 자동 부여 + 알림 / (스킬) 포인트 적립 + 알림.

---

## 6. 권한 모델 (RBAC)

- 등급: `admin > reviewer(운영자) > member > guest`.
- **로그인은 디스코드 계정이면 누구나 가능.** 단, 디스코드 역할(role)에 따라 메뉴·기능·노출이 결정됨.
- 로그인 시 `GET /users/@me/guilds/{guild}/member` (스코프 `guilds.members.read`)로 역할 배열 조회 → 세션 저장.
- 역할 ID → 등급 매핑은 환경변수로 설정 (`src/lib/rbac.ts`, `CAPABILITIES` 맵이 단일 진실 소스).
- 비멤버/역할 없는 사용자는 로그인은 되지만 보이는 기능이 제한됨.
- → **요구사항: 디스코드 권한 = 사이트 운영자 권한** 자동 충족.

---

## 7. 데이터 모델 (Supabase)

| 테이블 | 용도 |
|--------|------|
| `users` | discord_id, 이름, 아바타, roles[], tier, total_points(캐시), member_status, last_login |
| `applications` | 가입 신청: 신청자, form(jsonb), status, 검토자, 사유, 시각 |
| `skill_verifications` | 스킬 인증: 제출자, skill, points, evidence_url, status, 검토자 |
| `point_ledger` | 포인트 변동 append-only 기록 (total_points는 합산 캐시) |
| `messages` | 수집 채팅: discord msg id, 채널, 작성자, 내용, attachments, **image_url(영구)** |
| `poll_cursor` | 채널별 마지막 수집 msg id (증분 폴링) |
| `audit_log` | 운영자 액션 이력 |

- 모든 쓰기는 서버에서 **service_role 키**로 수행(RLS 우회), 권한 검증은 앱 RBAC로.
- RLS는 켜두되 public 정책 없음 → anon 키로 직접 접근 불가.
- Storage 버킷: `evidence`(증빙), `chat-images`(수집 이미지).

---

## 8. 디스코드 연동 상세

### OAuth
- 스코프: `identify`, `guilds`, `guilds.members.read`.
- Redirect URL: `https://<배포>/api/auth/callback/discord` (+ 로컬).

### 봇 (REST만 사용, 상시구동 X)
- 필요한 권한: View Channels, Read Message History(폴링), Send Messages(알림), **Manage Roles**(역할 자동부여).
- Manage Roles 동작 조건: 봇 역할이 부여 대상 역할보다 **위**에 있어야 함.

### 알림: DM → 채널 폴백
- 액션 발생 시 개인 **DM 시도** → 실패(사용자가 DM 차단 등)하면 **알림 채널에 @멘션**으로 공지.
- DM은 사용자 설정에 따라 실패 가능하므로 폴백 필수.

### 채팅 수집 + 이미지 보존
- 디스코드 첨부 이미지 URL은 **서명된 임시 링크로 ~24h 후 만료**.
- → 폴링 시 이미지를 다운로드해 **Supabase Storage(`chat-images`)에 복사 저장**, 영구 URL을 `messages.image_url`에 기록.
- 8MB 초과 이미지는 용량 보호 차원에서 스킵.

### 자동 정리 (retention)
- `cleanup` 예약 함수가 매일 1회 실행.
- `RETENTION_DAYS`(기본 **90일**) 지난 메시지 + 해당 이미지를 삭제 → 용량 일정 유지.

---

## 9. 결정 기록 (Decision Log)

| 질문 | 결정 |
|------|------|
| 프론트엔드 프레임워크 | **Next.js (App Router)** |
| 로그인 게이트 | **로그인은 전체 허용, 메뉴/기능/노출은 역할 기반 제어(RBAC)** |
| 알림 방식 | **DM 시도 → 실패 시 채널 멘션 폴백** |
| 채팅 수집 포함 여부 | **포함** (6번째 기능) |
| 증빙 이미지 업로드 | **필요** (Supabase Storage) |
| 승인 시 역할 부여 | **자동** (봇이 Discord 역할 부여) |
| 채팅 이미지 보존 | **Supabase로 복사 저장** (디스코드 URL 만료 대응) |
| 자동 정리 기간 | **90일 보관 후 삭제** |
| DB | **Supabase** (Neon/Netlify DB 대비 폴링에 유리) |
| 폴링 주기 | **5분** (무료 크레딧 여유) |

---

## 10. 남은 작업 (Next Steps)

- [ ] Discord Developer Portal: 앱 + 봇 생성, OAuth Redirect 등록, 봇 서버 초대.
- [ ] Supabase: 프로젝트 생성, `supabase/schema.sql` 실행, 버킷 확인.
- [ ] `.env` 채우기 (`.env.example` 기준), `AUTH_SECRET` 생성.
- [ ] 로컬 검증: 로그인 → 신청 → 승인 → 알림 플로우.
- [ ] Netlify 배포: 저장소 연결 + 환경변수 등록 + 예약함수 동작 확인.
- [ ] (선택) 멤버 관리에 수동 포인트 조정·역할 변경 UI 추가.
