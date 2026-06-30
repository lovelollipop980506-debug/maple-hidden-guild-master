import { env } from "@/lib/env";
import { computePermissions, hasManageGuild } from "@/lib/permissions";

const API = "https://discord.com/api/v10";

type Json = Record<string, unknown>;

/**
 * Low-level call to the Discord REST API using the bot token.
 * Retries on 429 (rate limit, honoring Retry-After) and on 5xx — so a transient
 * hiccup doesn't surface as a false "no permission" / empty result.
 */
async function botFetch(path: string, init?: RequestInit, retries = 3): Promise<Response> {
  const res = await fetch(`${API}${path}`, {
    ...init,
    headers: {
      Authorization: `Bot ${env.discord.botToken}`,
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
  });
  if ((res.status === 429 || res.status >= 500) && retries > 0) {
    const retryAfter = Number(res.headers.get("retry-after"));
    const waitMs = Number.isFinite(retryAfter) && retryAfter > 0 ? Math.min(retryAfter * 1000, 5000) : 500;
    await new Promise((r) => setTimeout(r, waitMs));
    return botFetch(path, init, retries - 1);
  }
  return res;
}

/**
 * Fetch a user's roles in a guild using THEIR OAuth access token.
 * Requires the `guilds.members.read` scope. Returns [] if not a guild member.
 */
export async function getGuildMemberRoles(accessToken: string, guildId: string): Promise<string[]> {
  if (!guildId) return [];
  const res = await fetch(`${API}/users/@me/guilds/${guildId}/member`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!res.ok) return [];
  const data = (await res.json()) as { roles?: string[] };
  return data.roles ?? [];
}

/** Send a message to a channel. Returns true on success. */
export async function sendChannelMessage(channelId: string, payload: Json): Promise<boolean> {
  if (!channelId) return false;
  const res = await botFetch(`/channels/${channelId}/messages`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
  return res.ok;
}

/** Open (or reuse) a DM channel with a user and send a message. */
export async function sendDM(userId: string, content: string): Promise<boolean> {
  const dm = await botFetch(`/users/@me/channels`, {
    method: "POST",
    body: JSON.stringify({ recipient_id: userId }),
  });
  if (!dm.ok) return false;
  const channel = (await dm.json()) as { id: string };
  return sendChannelMessage(channel.id, { content });
}

/**
 * Notify a user: try a DM first; if it fails, fall back to mentioning them in
 * the configured notify channel (if any).
 */
export async function notifyUser(
  userId: string,
  message: string,
  notifyChannelId?: string,
): Promise<"dm" | "channel" | "failed"> {
  const dmOk = await sendDM(userId, message);
  if (dmOk) return "dm";

  if (notifyChannelId) {
    const ok = await sendChannelMessage(notifyChannelId, {
      content: `<@${userId}> ${message}`,
      allowed_mentions: { users: [userId] },
    });
    if (ok) return "channel";
  }
  return "failed";
}

/** Grant a role to a guild member. Requires the bot to have Manage Roles. */
export async function addRole(guildId: string, userId: string, roleId: string): Promise<boolean> {
  if (!guildId || !roleId) return false;
  const res = await botFetch(`/guilds/${guildId}/members/${userId}/roles/${roleId}`, {
    method: "PUT",
  });
  return res.ok;
}

// ----------------------------------------------------------------------------
// Bootstrap / setup helpers
// ----------------------------------------------------------------------------

export type PartialGuild = { id: string; name: string };

/** Guilds the bot is a member of. */
export async function getBotGuilds(): Promise<PartialGuild[]> {
  const res = await botFetch(`/users/@me/guilds`);
  if (!res.ok) return [];
  const data = (await res.json()) as Array<{ id: string; name: string }>;
  return data.map((g) => ({ id: g.id, name: g.name }));
}

/** The owner_id of a guild (used to gate setup and grant admin). */
export async function getGuildOwnerId(guildId: string): Promise<string | null> {
  if (!guildId) return null;
  const res = await botFetch(`/guilds/${guildId}`);
  if (!res.ok) return null;
  const data = (await res.json()) as { owner_id?: string };
  return data.owner_id ?? null;
}

/** A member's assigned role IDs in a guild (via bot). null if not a member. */
export async function getMemberRoles(guildId: string, userId: string): Promise<string[] | null> {
  const res = await botFetch(`/guilds/${guildId}/members/${userId}`);
  if (!res.ok) return null;
  const data = (await res.json()) as { roles?: string[] };
  return data.roles ?? [];
}

/**
 * Whether a user may run the bootstrap for a guild: the guild owner, or anyone
 * with Administrator / Manage Server permission. Uses Discord's own authority.
 */
export async function canManageGuild(guildId: string, userId: string): Promise<boolean> {
  if (!guildId) return false;
  const ownerId = await getGuildOwnerId(guildId);
  if (ownerId === userId) return true;
  const memberRoles = await getMemberRoles(guildId, userId);
  if (!memberRoles) return false;
  const guildRoles = await getGuildRoles(guildId);
  const perms = computePermissions(memberRoles, guildRoles, guildId, false);
  return hasManageGuild(perms);
}

/** Among the bot's guilds, those the user owns or can manage (Manage Server). */
export async function getManageableGuilds(userId: string): Promise<PartialGuild[]> {
  const guilds = await getBotGuilds();
  const out: PartialGuild[] = [];
  for (const g of guilds) {
    if (await canManageGuild(g.id, userId)) out.push(g);
  }
  return out;
}

export type GuildChannel = { id: string; name: string; type: number };

/** Text/announcement channels in a guild. */
export async function listGuildChannels(guildId: string): Promise<GuildChannel[]> {
  if (!guildId) return [];
  const res = await botFetch(`/guilds/${guildId}/channels`);
  if (!res.ok) return [];
  const data = (await res.json()) as Array<{ id: string; name: string; type: number; position: number }>;
  return data
    .filter((c) => c.type === 0 || c.type === 5) // GUILD_TEXT, GUILD_ANNOUNCEMENT
    .sort((a, b) => a.position - b.position)
    .map((c) => ({ id: c.id, name: c.name, type: c.type }));
}

export type GuildRole = {
  id: string;
  name: string;
  permissions: string;
  managed: boolean;
  position: number;
};

/** All roles in a guild (includes @everyone and managed roles) — for permission math. */
export async function getGuildRoles(guildId: string): Promise<GuildRole[]> {
  if (!guildId) return [];
  const res = await botFetch(`/guilds/${guildId}/roles`);
  if (!res.ok) return [];
  return (await res.json()) as GuildRole[];
}

/** Assignable roles for the setup UI (excludes @everyone and managed integration roles). */
export async function listGuildRoles(guildId: string): Promise<GuildRole[]> {
  const roles = await getGuildRoles(guildId);
  return roles
    .filter((r) => r.id !== guildId && !r.managed) // drop @everyone + bot/integration roles
    .sort((a, b) => b.position - a.position);
}

export type GuildMemberRaw = {
  discordId: string;
  nick: string;
  avatar: string | null;
  roleIds: string[];
  bot: boolean;
};

/**
 * List a guild's members. Requires the bot's **Server Members Intent** (privileged)
 * — without it Discord returns 403. Returns up to `limit` (Discord max 1000).
 */
export async function getGuildMembers(guildId: string, limit = 1000): Promise<GuildMemberRaw[]> {
  if (!guildId) return [];
  const res = await botFetch(`/guilds/${guildId}/members?limit=${limit}`);
  if (!res.ok) return [];
  const data = (await res.json()) as Array<{
    user: { id: string; username: string; global_name?: string | null; avatar?: string | null; bot?: boolean };
    nick?: string | null;
    roles: string[];
  }>;
  return data.map((m) => ({
    discordId: m.user.id,
    nick: m.nick || m.user.global_name || m.user.username,
    avatar: m.user.avatar ? `https://cdn.discordapp.com/avatars/${m.user.id}/${m.user.avatar}.png` : null,
    roleIds: m.roles ?? [],
    bot: !!m.user.bot,
  }));
}

export type UserGuild = { id: string; name: string; owner: boolean; permissions: string };

/** Guilds the *user* is in, with their permissions (OAuth `guilds` scope). */
export async function getUserGuilds(accessToken: string): Promise<UserGuild[]> {
  const res = await fetch(`${API}/users/@me/guilds`, { headers: { Authorization: `Bearer ${accessToken}` } });
  if (!res.ok) return [];
  return (await res.json()) as UserGuild[];
}

// View Channels + Send Messages + Read Message History + Manage Roles
export const BOT_INVITE_PERMISSIONS = "268504064";

/** OAuth2 bot invite URL. `guildId` pre-selects (and locks) the target server. */
export function botInviteUrl(guildId?: string): string {
  const base =
    `https://discord.com/oauth2/authorize?client_id=${env.discord.clientId}` +
    `&permissions=${BOT_INVITE_PERMISSIONS}&scope=bot+applications.commands`;
  return guildId ? `${base}&guild_id=${guildId}&disable_guild_select=true` : base;
}

export type DiscordMessage = {
  id: string;
  channel_id: string;
  author: { id: string; username: string; global_name?: string | null };
  content: string;
  attachments: Array<{ id: string; url: string; filename: string; content_type?: string }>;
  timestamp: string;
};

/** Fetch messages from a channel, optionally only those after `afterId`. */
export async function fetchChannelMessages(
  channelId: string,
  afterId?: string,
  limit = 100,
): Promise<DiscordMessage[]> {
  const params = new URLSearchParams({ limit: String(limit) });
  if (afterId) params.set("after", afterId);
  const res = await botFetch(`/channels/${channelId}/messages?${params.toString()}`);
  if (!res.ok) return [];
  return (await res.json()) as DiscordMessage[];
}
