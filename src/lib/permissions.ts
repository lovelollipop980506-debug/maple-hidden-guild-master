/**
 * Discord permission helpers.
 * - suggestTier: propose a site tier from a role's permission bits (for /setup).
 * - computePermissions/hasAdmin/hasManageGuild: resolve a member's effective
 *   permissions to decide admin tier and who may run the bootstrap.
 */

// Discord permission bits
export const ADMINISTRATOR = 1n << 3n;
export const MANAGE_GUILD = 1n << 5n;
const KICK_MEMBERS = 1n << 1n;
const BAN_MEMBERS = 1n << 2n;
const MANAGE_CHANNELS = 1n << 4n;
const MANAGE_MESSAGES = 1n << 13n;
const MANAGE_ROLES = 1n << 28n;
const MODERATE_MEMBERS = 1n << 40n;

const MOD_PERMS =
  KICK_MEMBERS |
  BAN_MEMBERS |
  MANAGE_CHANNELS |
  MANAGE_GUILD |
  MANAGE_MESSAGES |
  MANAGE_ROLES |
  MODERATE_MEMBERS;

/** Returns "admin" | "reviewer" | "none" — a suggestion, not a decision. */
export function suggestTier(permissions: string): "admin" | "reviewer" | "none" {
  let p: bigint;
  try {
    p = BigInt(permissions);
  } catch {
    return "none";
  }
  if ((p & ADMINISTRATOR) === ADMINISTRATOR) return "admin";
  if ((p & MOD_PERMS) !== 0n) return "reviewer";
  return "none";
}

type RolePerm = { id: string; permissions: string };

/**
 * OR together the permission bits of @everyone + the member's assigned roles.
 * The guild owner is treated as having ADMINISTRATOR.
 */
export function computePermissions(
  memberRoleIds: string[],
  guildRoles: RolePerm[],
  guildId: string,
  isOwner: boolean,
): bigint {
  if (isOwner) return ADMINISTRATOR;
  let perms = 0n;
  for (const r of guildRoles) {
    if (r.id === guildId || memberRoleIds.includes(r.id)) {
      try {
        perms |= BigInt(r.permissions);
      } catch {
        /* ignore malformed */
      }
    }
  }
  return perms;
}

export function hasAdmin(perms: bigint): boolean {
  return (perms & ADMINISTRATOR) === ADMINISTRATOR;
}

/** Administrator implies every permission, including Manage Server. */
export function hasManageGuild(perms: bigint): boolean {
  return hasAdmin(perms) || (perms & MANAGE_GUILD) === MANAGE_GUILD;
}
