import { env } from "@/lib/env";
import { getUserGuilds, getBotGuilds, botInviteUrl } from "@/lib/discord";

const MANAGE_GUILD = 1n << 5n;

function canManage(g: { owner: boolean; permissions: string }): boolean {
  if (g.owner) return true;
  try {
    return (BigInt(g.permissions) & MANAGE_GUILD) === MANAGE_GUILD;
  } catch {
    return false;
  }
}

/**
 * 봇 초대 정보: 사용자가 "서버 관리" 권한을 가진 서버 목록 + 각 서버에 봇이 이미 있는지,
 * 없으면 그 서버로 바로 초대하는 링크. (Discord도 초대 시 권한을 강제함)
 */
export async function getInviteInfo(accessToken: string | undefined) {
  const generic = botInviteUrl();
  if (!accessToken) {
    return { clientId: env.discord.clientId, genericInviteUrl: generic, targets: [], needsRelogin: true };
  }
  const [userGuilds, botGuilds] = await Promise.all([getUserGuilds(accessToken), getBotGuilds()]);
  const botIds = new Set(botGuilds.map((g) => g.id));
  const targets = userGuilds
    .filter(canManage)
    .map((g) => ({ id: g.id, name: g.name, botPresent: botIds.has(g.id), inviteUrl: botInviteUrl(g.id) }));

  return { clientId: env.discord.clientId, genericInviteUrl: generic, targets, needsRelogin: false };
}
