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
  if (has(mapping.member)) return "member";
  return "guest";
}

/** True if `tier` meets or exceeds `required`. */
export function atLeast(tier: Tier, required: Tier): boolean {
  return TIER_RANK[tier] >= TIER_RANK[required];
}

/**
 * Capability map — what each feature/menu requires.
 * Single source of truth for route gating and nav rendering.
 */
export const CAPABILITIES = {
  "apply.submit": "guest", // anyone logged in can submit a join application
  "skills.submit": "member", // only guild members can submit skill verifications
  "skills.review": "reviewer",
  "applications.review": "reviewer",
  "members.manage": "reviewer",
  "messages.view": "reviewer",
  "stats.view": "reviewer",
  "setup.manage": "admin",
  "admin.all": "admin",
} as const;

export type Capability = keyof typeof CAPABILITIES;

export function can(tier: Tier, capability: Capability): boolean {
  return atLeast(tier, CAPABILITIES[capability] as Tier);
}
