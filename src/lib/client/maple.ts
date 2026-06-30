// 메이플 도메인 라벨/옵션 — 프론트가 해석(백엔드는 키만 저장).

export const SKILL_KEYS = ["boss", "ignore", "attack", "exp", "accuracy"] as const;
export type SkillKey = (typeof SKILL_KEYS)[number];

export const SKILL_LABELS: Record<string, string> = {
  boss: "보공",
  ignore: "방무",
  attack: "공/마",
  exp: "경험치",
  accuracy: "명중률",
};

export const ROUTE_LABELS: Record<string, string> = {
  friend: "지인 추천",
  community: "커뮤니티",
  ingame: "인게임",
  etc: "기타",
};

export const RANKS = ["길드마스터", "부마스터", "일반길드원"];

export const STATUS_LABELS: Record<string, string> = {
  pending: "대기",
  approved: "승인",
  rejected: "반려",
};

export const TIER_LABELS: Record<string, string> = {
  admin: "길드 마스터",
  reviewer: "부마스터",
  member: "멤버",
  guest: "게스트",
};
