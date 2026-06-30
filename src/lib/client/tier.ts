import type { Tier } from "./types";

// admin > reviewer > member > guest
export const TIER_RANK: Record<Tier, number> = { admin: 3, reviewer: 2, member: 1, guest: 0 };
export const TIER_LABEL: Record<Tier, string> = {
  admin: "관리자",
  reviewer: "운영자",
  member: "멤버",
  guest: "게스트",
};

/** tier 가 required 등급 이상인지. 메뉴/페이지 게이팅에 사용(보안은 서버가 최종 방어). */
export function tierAtLeast(tier: Tier | undefined | null, required: Tier): boolean {
  if (!tier) return false;
  return TIER_RANK[tier] >= TIER_RANK[required];
}
