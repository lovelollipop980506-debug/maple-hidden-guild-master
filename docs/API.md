# HD Guild — 백엔드 API 정의

프론트는 **같은 Next.js 앱**(쿠키 세션, CORS 불필요). 백엔드는 `/api/v1/*` JSON Route Handler.
실행: **Netlify**(서버리스/SSR) + **Supabase**(Postgres/Storage).

핵심 추상화: **모든 "양식"은 공통 폼 시스템**으로 일반화됨.
- `forms` = 동적 폼 정의(필드 스키마, 제출권한, 승인동작, 수집경로)
- `form_submissions` = 제출/검토 (웹 제출 또는 디스코드 채널 수집)
- 가입신청 = `key=join` 폼, 스킬포인트 = `key=skill_points` 폼. 새 폼은 운영자가 추가.

---

## 공통 규약

- **Base**: `/api/v1/*` (버전 프리픽스). 인증만 `/api/auth/*`.
- **응답**: 성공 `{ "ok": true, "data": ... }` · 실패 `{ "ok": false, "error": { "code", "message" } }`
- **상태코드**: 200 · 201 생성 · 400 입력 · 401 미인증 · 403 권한 · 404 없음 · 409 충돌.
- **페이지네이션**: `?limit=&offset=` (기본 50/최대 100), 목록 응답 `{ items, total, limit, offset }`.

### 인증·권한 3원칙
1. **모든 API 로그인 필수** (`/api/auth/*` 제외) → 미로그인 `401`.
2. **가입 신청서 등 일부 폼은 역할 없이 제출 가능** (폼의 `submitMinTier=guest`).
3. **그 외 전부 member 이상**(서버 참여 + 역할 보유). 폼 제출 권한은 **폼별 `submitMinTier`** 로 결정.

### 등급(tier)
`admin`(소유자/Administrator/admin역할) > `reviewer`(reviewer역할/관리권한) > `member`(서버참여+역할 1개↑) > `guest`(로그인만).

---

## 1) 인증 / 내 정보
| 메서드 | 경로 | 권한 | 설명 |
|---|---|---|---|
| `GET/POST` | `/api/auth/*` | 공개 | Auth.js (Discord 로그인) |
| `GET` | `/api/v1/me` | 로그인 | 내 프로필+등급 `{discordId,name,avatar,tier,isAdmin,roles,memberStatus,totalPoints,characterName,level,job}` |
| `PUT` | `/api/v1/me/profile` | 로그인 | 내 캐릭터 프로필 수정 `{characterName,level,job}` |

## 2) 설정 / 부트스트랩
| 메서드 | 경로 | 권한 | 설명 |
|---|---|---|---|
| `GET` | `/api/v1/config` | 로그인 | `{ setupCompleted, guildId, guildName }` |
| `GET` | `/api/v1/setup/options` | 소유자/관리권한자 | 감지 서버·채널·역할(+추천등급)·현재설정 |
| `PUT` | `/api/v1/setup` | 소유자/관리권한자 | 저장 `{ guildId, notifyChannelId, roleTiers }` |
| `GET` | `/api/v1/discord/meta` | reviewer | 길드 채널·역할 목록 (폼 빌더용) |

## 3) 폼 (정의 / 빌더)
| 메서드 | 경로 | 권한 | 설명 |
|---|---|---|---|
| `GET` | `/api/v1/forms` | 로그인 | 활성 폼 목록 (admin은 `?all=1`로 비활성 포함) |
| `GET` | `/api/v1/forms/{key}` | 로그인 | 폼 정의 |
| `POST` | `/api/v1/forms` | admin | 폼 생성 |
| `PUT` | `/api/v1/forms/{key}` | admin | 폼 수정 |
| `DELETE` | `/api/v1/forms/{key}` | admin | 폼 비활성화 |

**폼 객체**
```json
{
  "key": "skill_points", "title": "...", "description": "...",
  "fields": [{ "name":"points", "label":"포인트", "type":"text|textarea|number|select|checkbox|image", "required":true, "options":[] }],
  "intake": "web | discord", "discordChannelId": null,
  "submitMinTier": "guest|member|reviewer|admin",
  "requiresApproval": true,
  "onApprove": { "grantRoleId": "...", "awardPointsField": "points", "awardPointsFixed": 0 },
  "active": true, "sort": 0
}
```

## 4) 제출 / 검토
| 메서드 | 경로 | 권한 | 설명 |
|---|---|---|---|
| `POST` | `/api/v1/forms/{key}/submissions` | 폼별(`submitMinTier`) | 웹 제출 (`multipart/form-data`; image 필드는 파일) |
| `GET` | `/api/v1/forms/{key}/submissions?status=&source=` | reviewer | 해당 폼 제출 목록 |
| `GET` | `/api/v1/submissions?formKey=&status=&source=` | reviewer | 전체 검토 큐 (`source=discord`=수집된 채팅) |
| `GET` | `/api/v1/submissions/mine` | 로그인 | 내 제출 내역(전 폼) |
| `POST` | `/api/v1/submissions/{id}/review` | reviewer | 승인/반려 `{ decision, note }` |

- **승인 부수효과**(폼 `onApprove`): `grantRoleId`→봇 역할부여+멤버승격 / `awardPointsField|Fixed`→포인트 적립. 처리 후 제출자에게 알림(DM→채널).
- **디스코드 수집**: `intake=discord` 폼은 예약함수가 채널 메시지를 `source=discord` 제출로 적재(answers=`{content,image_url,author_name}`) → 같은 검토 큐에서 확인.
- **검토 목록 응답**: 각 항목에 `forms:{title}` + (web) 제출자 `user:{username,global_name,avatar}` 포함. (discord는 `answers.author_name` 사용)
- **멤버 상세**: `pointLogs:[{id,delta,reason,created_at}]` 포함. 멤버 목록/상세에 `character_name,level,job` 포함.
- **가입 승인 시**: answers의 `character_name/level/job`이 사용자 프로필로 동기화됨.

## 5) 멤버 관리
| 메서드 | 경로 | 권한 | 설명 |
|---|---|---|---|
| `GET` | `/api/v1/members?sort=points\|recent` | reviewer | 멤버 목록 |
| `GET` | `/api/v1/members/{discordId}` | reviewer | 멤버 상세 + 포인트 내역 |
| `POST` | `/api/v1/members/{discordId}/points` | admin | 포인트 수동 조정 `{ delta, reason }` |

## 6) 통계
| 메서드 | 경로 | 권한 | 설명 |
|---|---|---|---|
| `GET` | `/api/v1/stats` | reviewer | `{ totalMembers, approvedMembers, activeForms, pendingSubmissions, totalSubmissions, totalPointsAwarded, topPoints[], submissionStatus }` |

---

## 백그라운드 (Netlify 예약함수)
| 함수 | 주기 | 설명 |
|---|---|---|
| `poll-messages` | 5분 | 활성 `intake=discord` 폼의 채널 → `form_submissions(source=discord)` 적재 + 이미지 영구 복사 |
| `cleanup` | 매일 | `RETENTION_DAYS`(기본 90일) 지난 **디스코드 수집 제출**과 이미지 삭제 (웹 제출은 보존) |

## 확장성 (새 API 추가)
`라우트(얇음) → 서비스(lib/services) → lib`. `withAuth(handler,{capability})` 가드 + `lib/rbac.ts CAPABILITIES` 레지스트리.
새 엔드포인트 = 권한 한 줄 + 서비스 함수 + 10줄 라우트. **새 "양식"은 코드 변경 없이 폼 생성만으로 추가.**

## 시크릿(env) vs 설정(DB)
- **env**: `DISCORD_CLIENT_ID/SECRET`, `DISCORD_BOT_TOKEN`, `AUTH_SECRET`, Supabase 키, `RETENTION_DAYS`.
- **DB(app_config, /setup)**: guildId, notifyChannel, 역할→등급 매핑.
- **DB(forms)**: 폼별 필드·수집채널·승인동작.
