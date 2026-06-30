/**
 * App permission tiers, highest to lowest.
 * Derived from a user's Discord roles (and guild-owner status) at login time.
 */
export type Tier = "admin" | "reviewer" | "member" | "guest";

export type RoleMapping = {
  admin: string[];
  reviewer: string[];
  member: string[];
};

const TIER_RANK: Record<Tier, number> = {
  admin: 3,
  reviewer: 2,
  member: 1,
  guest: 0,
};

/**
 * Resolve the highest app tier for a user.
 * `forceAdmin` is set when the user holds Discord Administrator permission or is
 * the guild owner (read live from Discord — not a hardcoded ID). Otherwise the
 * tier comes from the role->tier mapping.
 */
export function resolveTier(
  discordRoleIds: string[],
  mapping: RoleMapping,
  forceAdmin = false,
): Tier {
  if (forceAdmin) return "admin";
  const has = (ids: string[]) => ids.some((id) => discordRoleIds.includes(id));
  if (has(mapping.admin)) return "admin";
  if (has(mapping.reviewer)) return "reviewer";
  // member = belongs to the guild with at least one assigned role
  // (an explicit memberRoleIds mapping still qualifies, but any role does too).
  if (discordRoleIds.length > 0 || has(mapping.member)) return "member";
  return "guest";
}

/** True if `tier` meets or exceeds `required`. */
export function atLeast(tier: Tier, required: Tier): boolean {
  return TIER_RANK[tier] >= TIER_RANK[required];
}

/**
 * Capability registry — minimum tier required per action.
 * Single source of truth for API gating. Add a line here to define a new permission.
 * (Setup/bootstrap is gated separately via a live Discord Manage-Server check.)
 */
export const CAPABILITIES = {
  "me.read": "guest", // any logged-in user
  "me.update": "guest", // edit own profile
  "config.read": "guest",
  "stats.view": "guest", // 홈 길드 요약 (로그인하면 누구나)
  "notices.view": "guest", // 공지 보기
  "forms.view": "guest", // list/get form definitions
  "submissions.submit": "guest", // login gate; per-form min tier enforced in service
  "submissions.mine": "guest",
  // 운영(operator) 이상
  "submissions.review": "reviewer", // 인증/가입 승인·반려, 검토 큐 (인증 대기/승인 로그 포함)
  "members.view": "reviewer", // 길드원 조회(관리자 전용)
  "members.manage": "reviewer", // 멤버 추가/수정/삭제/초기화
  "notices.manage": "reviewer", // 공지 관리
  "discord.meta": "reviewer",
  // 관리자
  "forms.manage": "admin", // 폼 빌더
} as const;

export type Capability = keyof typeof CAPABILITIES;

export function can(tier: Tier, capability: Capability): boolean {
  return atLeast(tier, CAPABILITIES[capability] as Tier);
}
