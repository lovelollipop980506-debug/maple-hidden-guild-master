# HD Guild — 디스코드 연동 길드 관리 (백엔드)

Next.js (App Router) + Supabase + Discord OAuth. Netlify 무료 호스팅 기준.

> **현재 이 저장소는 백엔드(API) 중심입니다.** 프론트엔드(UI)는 별도로 같은 Next.js 프로젝트의 `app/`에 추가됩니다.
> API 명세: [docs/API.md](docs/API.md) · 설계/결정: [docs/PLAN.md](docs/PLAN.md)
>
> 구조: `app/api/v1/*`(라우트, 얇음) → `lib/services/*`(로직) → `lib/*`(supabase/discord/config/rbac).
> 권한: `lib/api/guard.ts`의 `withAuth(handler, { capability })` + `lib/rbac.ts`의 `CAPABILITIES`.

## 기능

1. **디스코드 로그인** — Discord OAuth. 로그인은 누구나 가능, 디스코드 역할(role)에 따라 기능 접근(RBAC).
2. **가입 신청서** — 작성/제출 → 운영자 승인·반려 → 신청자에게 알림(DM→채널 폴백).
3. **스킬 포인트 인증** — 증빙 이미지 업로드 → 운영자 승인 시 포인트 적립.
4. **멤버 관리** — 멤버 목록·등급·포인트·상태.
5. **통계** — KPI 카드 + 포인트 상위/신청 현황 차트.
6. **채팅 수집** — 디스코드 채널 메시지를 5분마다 수집(Netlify 예약 함수) → 운영자 검토.
   - 메시지에 포함된 **이미지는 Supabase Storage로 복사 저장**(디스코드 CDN URL이 ~24h 후 만료되므로). `messages.image_url`에 영구 URL 저장.
   - **자동 정리**: `cleanup` 예약 함수가 매일 돌며 `RETENTION_DAYS`(기본 90일) 지난 메시지·이미지를 삭제 → 무료 용량 내 유지.

## 권한 등급 (RBAC)

`admin > reviewer(운영자) > member > guest`. 디스코드 역할 ID를 환경변수로 각 등급에 매핑합니다 (`src/lib/rbac.ts`).

## 사전 준비

### 1) Discord Developer Portal
- **Application** 생성 → **OAuth2**: Redirect URL에 `https://<배포주소>/api/auth/callback/discord` (+ 로컬 `http://localhost:3000/api/auth/callback/discord`) 등록.
- **Bot** 생성 → 토큰 발급. 봇 권한: View Channels, Read Message History, Send Messages, **Manage Roles**.
- 봇을 서버에 초대. (Manage Roles가 동작하려면 봇 역할이 부여할 역할보다 **위**에 있어야 함.)
- 수집: Client ID/Secret, Bot Token, Guild ID, 소스 채널 ID(들), 알림 채널 ID, 역할 ID들.

### 2) Supabase
- 프로젝트 생성 → `supabase/schema.sql`을 SQL 에디터에서 실행.
- Storage에 `evidence` 버킷 생성(Public). (스키마 SQL에 생성 구문 포함)
- Settings > API에서 URL / anon key / service_role key 확보.

### 3) 환경변수
`.env.example`를 `.env`로 복사해 채웁니다. Netlify 배포 시 동일 값을 **Site settings > Environment variables**에 등록.

```bash
cp .env.example .env
openssl rand -base64 32   # AUTH_SECRET 생성
```

## 로컬 실행

```bash
npm install
npm run dev      # http://localhost:3000
```

## 배포 (Netlify)

- 저장소 연결 → 빌드는 `netlify.toml`이 처리(`@netlify/plugin-nextjs`).
- 환경변수 등록 (위 `.env` 값 + `AUTH_URL`=배포 주소).
- 예약 함수 `poll-messages`는 자동 등록되어 5분마다 실행됩니다.

## 비용 메모 (무료 티어)

- 채팅 폴링은 5분 주기 기준 Netlify 크레딧 ~48/월(월 300 중). 주기를 줄이려면 `netlify/functions/poll-messages.ts`의 `config.schedule` 수정.
- Supabase 무료: DB + Storage **1GB**, 전송 5GB/월. 이미지 장당 ~500KB면 약 2,000장 보관 가능.
- **자동 과금 없음**: Supabase/Netlify 무료 플랜은 카드 없이 동작하며, 한도 초과 시 청구가 아니라 일시 중단됨. `RETENTION_DAYS`로 용량을 일정하게 유지하면 사실상 영구 무료.
