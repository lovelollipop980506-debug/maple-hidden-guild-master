# Claude Design 프롬프트 ② — 시안을 실제 연동 코드로 구현

Phase 1 시안/인벤토리가 나온 뒤, 그걸 **백엔드에 연결된 실제 Next.js 코드**로 만드는 프롬프트.
아래 블록을 그대로 붙여넣으세요.

---

```
# 목표
앞에서 만든 Phase 1 화면 시안을, 이미 완성된 백엔드에 연결되는 "동작하는 Next.js(App Router)
코드"로 구현한다. 기존 디자인 시스템 컴포넌트를 그대로 사용한다. 백엔드 코드는 절대 수정하지 않는다.

# 전제 (이미 존재. 건드리지 말 것)
- 백엔드: src/app/api/**, src/lib/services/**, src/lib/discord.ts, src/lib/config.ts,
  src/lib/rbac.ts, src/lib/api/**, src/auth.ts, netlify/functions/**, supabase/**, .env
- 인증: Auth.js(next-auth v5). 라우트 핸들러는 쿠키 세션으로 보호됨.
- 데이터 API: /api/v1/*, 응답 { ok:true,data } | { ok:false,error:{code,message} }.

# 디렉토리 규칙 (여기에만 추가/수정)
- 페이지:        src/app/<route>/page.tsx (+ 필요한 client 컴포넌트)
- 공통 UI:       src/components/**
- 프론트 전용 lib: src/lib/client/**  (예: apiClient, hooks)
- 루트 레이아웃:  src/app/layout.tsx 는 SessionProvider 추가만(최소 수정), globals 유지.
- src/app/page.tsx 의 플레이스홀더는 대시보드로 교체.

# 반드시 먼저 만들 공통 인프라
1) API 클라이언트  src/lib/client/api.ts
   - apiGet<T>(path), apiPost<T>(path, json), apiPostForm<T>(path, FormData), apiPut, apiDelete.
   - 항상 fetch(path, { credentials:"same-origin" }). 응답 파싱:
     ok=true → data 반환 / ok=false → throw new ApiError(error.code, error.message, status).
   - 401 → 로그인 페이지 유도(또는 signIn). 호출부는 try/catch로 토스트.
2) 세션/사용자  src/lib/client/useMe.ts
   - SessionProvider(next-auth/react)를 layout에 추가.
   - useMe(): GET /api/v1/me 결과({discordId,name,avatar,tier,isAdmin,roles,memberStatus,totalPoints})를
     로딩/에러와 함께 반환. (SWR 또는 간단한 useEffect+useState)
3) 권한 유틸  src/lib/client/tier.ts
   - tierAtLeast(tier, required): admin>reviewer>member>guest 비교.
   - 메뉴/페이지 게이팅에 사용(서버가 최종 방어하므로 UI는 숨김/안내 수준).
4) 공통 컴포넌트(디자인 시스템 기반): 내비게이션, 토스트(provider), 상태배지,
   폼 필드(Input/Textarea/Select/Checkbox/FileInput), 데이터 테이블, 빈/에러/로딩 상태, 확인 모달.

# 구현할 화면 (Phase 1) — 각 API 그대로 연결
- /login : signIn("discord") 버튼.
- / 대시보드 : useMe + GET /api/v1/submissions/mine(최근) + GET /api/v1/config(설정배너).
- /join : 폼(character_name*, playtime, referral, introduction) →
          apiPostForm("/api/v1/forms/join/submissions", fd). 409 처리.
- /skills : 폼(skill*, points*[number], note, evidence[file]) →
            apiPostForm("/api/v1/forms/skill_points/submissions", fd). 상단 내 포인트 표시.
- /me/submissions : GET /api/v1/submissions/mine (상태배지/사유/증빙).
- /review (reviewer+) : GET /api/v1/submissions?status=&formKey=&source= + 필터 UI,
          승인/반려 → POST /api/v1/submissions/{id}/review {decision,note}. discord 항목은
          answers.content/image_url/author_name 표시. 처리 후 목록 갱신.
- /members (reviewer+) : GET /api/v1/members?sort= ; /members/[discordId] 상세
          (GET /api/v1/members/{id}); admin이면 POST /api/v1/members/{id}/points {delta,reason}.
- /stats (reviewer+) : GET /api/v1/stats → KPI 카드 + 차트.
- /setup (admin/소유자) : GET /api/v1/setup/options → 매핑 UI,
          PUT /api/v1/setup {guildId,notifyChannelId,roleTiers}. 저장 후 "다시 로그인" 안내.

# 내비게이션 게이팅
useMe().tier 기준: member↑(대시보드/폼/내제출), reviewer↑(검토/멤버/통계), admin(설정).
setupCompleted=false(=/api/v1/config) && isAdmin이면 상단 "초기 설정" 배너 노출.

# 데이터 형태 (참고)
me: {discordId,name,avatar,tier,isAdmin,roles[],memberStatus,totalPoints}
submission(mine): {id,form_key,answers,status,review_note,created_at,reviewed_at,forms:{title}}
submission(review): {id,form_id,form_key,user_id,answers,status,source,discord_message_id,created_at}
member: {discord_id,username,global_name,avatar,tier,total_points,member_status,last_login}
stats: {totalMembers,approvedMembers,activeForms,pendingSubmissions,totalSubmissions,totalPointsAwarded,topPoints[],submissionStatus}
setup options: {setupCompleted,guild:{id,name},channels:[{id,name}],roles:[{id,name,suggestedTier}],config:{notifyChannelId}}

# 품질 요건
- 모든 화면 로딩/빈/에러 상태. 액션 토스트 + 즉시 갱신. 모바일 반응형. 한국어.
- TypeScript 타입 명시. 접근성(라벨/포커스). 콘솔 에러 0.

# 산출물
파일 경로별로 전체 코드를 제시(공통 인프라 → 공통 컴포넌트 → 화면 순). 각 파일은 그대로
프로젝트에 붙여넣어 동작해야 한다. 마지막에 "추가/수정한 파일 목록"과 실행 확인 절차를 요약.
```

---

> 이 코드가 나오면 같은 레포 `src/`에 붙여넣고 `npm run dev`로 백엔드와 함께 바로 확인 가능합니다.
> (백엔드는 그대로 두므로 충돌 없음 — 추가되는 건 페이지/컴포넌트/`lib/client`뿐)
