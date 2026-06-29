import { env } from "@/lib/env";

const API = "https://discord.com/api/v10";

type Json = Record<string, unknown>;

/** Low-level call to the Discord REST API using the bot token. */
async function botFetch(path: string, init?: RequestInit): Promise<Response> {
  return fetch(`${API}${path}`, {
    ...init,
    headers: {
      Authorization: `Bot ${env.discord.botToken}`,
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
  });
}

/**
 * Fetch a user's roles in the configured guild using THEIR OAuth access token.
 * Requires the `guilds.members.read` scope. Returns [] if not a guild member.
 */
export async function getGuildMemberRoles(accessToken: string): Promise<string[]> {
  const res = await fetch(`${API}/users/@me/guilds/${env.discord.guildId}/member`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!res.ok) return []; // 404 => not a member of the guild
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
 * Notify a user: try a DM first; if it fails (DMs closed / not shared server),
 * fall back to mentioning them in the configured notify channel.
 */
export async function notifyUser(userId: string, message: string): Promise<"dm" | "channel" | "failed"> {
  const dmOk = await sendDM(userId, message);
  if (dmOk) return "dm";

  if (env.discord.notifyChannelId) {
    const ok = await sendChannelMessage(env.discord.notifyChannelId, {
      content: `<@${userId}> ${message}`,
      allowed_mentions: { users: [userId] },
    });
    if (ok) return "channel";
  }
  return "failed";
}

/** Grant a role to a guild member. Requires the bot to have Manage Roles. */
export async function addRole(userId: string, roleId: string): Promise<boolean> {
  if (!roleId) return false;
  const res = await botFetch(
    `/guilds/${env.discord.guildId}/members/${userId}/roles/${roleId}`,
    { method: "PUT" },
  );
  return res.ok;
}

export type DiscordMessage = {
  id: string;
  channel_id: string;
  author: { id: string; username: string; global_name?: string | null };
  content: string;
  attachments: Array<{ id: string; url: string; filename: string; content_type?: string }>;
  timestamp: string;
};

/**
 * Fetch messages from a channel, optionally only those after `afterId`.
 * Returns up to `limit` messages (Discord max 100), oldest-first ordering
 * is NOT guaranteed by the API, so callers should sort by id if needed.
 */
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
