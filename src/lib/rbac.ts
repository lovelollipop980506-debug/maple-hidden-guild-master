import { env } from "@/lib/env";

/**
 * App permission tiers, highest to lowest.
 * Derived from a user's Discord roles at login time.
 */
export type Tier = "admin" | "reviewer" | "member" | "guest";

const TIER_RANK: Record<Tier, number> = {
  admin: 3,
  reviewer: 2,
  member: 1,
  guest: 0,
};

/** Resolve the highest app tier a set of Discord role IDs maps to. */
export function resolveTier(discordRoleIds: string[]): Tier {
  const has = (ids: string[]) => ids.some((id) => discordRoleIds.includes(id));
  if (has(env.roles.admin)) return "admin";
  if (has(env.roles.reviewer)) return "reviewer";
  if (has(env.roles.member)) return "member";
  return "guest";
}

/** True if `tier` meets or exceeds `required`. */
export function atLeast(tier: Tier, required: Tier): boolean {
  return TIER_RANK[tier] >= TIER_RANK[required];
}

/**
 * Capability map — what each feature/menu requires.
 * Keep route gating and nav rendering driven by this single source of truth.
 */
export const CAPABILITIES = {
  "apply.submit": "guest", // anyone logged in can submit a join application
  "skills.submit": "member", // only guild members can submit skill verifications
  "skills.review": "reviewer",
  "applications.review": "reviewer",
  "members.manage": "reviewer",
  "messages.view": "reviewer",
  "stats.view": "reviewer",
  "admin.all": "admin",
} as const;

export type Capability = keyof typeof CAPABILITIES;

export function can(tier: Tier, capability: Capability): boolean {
  return atLeast(tier, CAPABILITIES[capability] as Tier);
}
