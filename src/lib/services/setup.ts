import { getConfig, saveConfig } from "@/lib/config";
import { getManageableGuilds, listGuildChannels, listGuildRoles } from "@/lib/discord";
import { suggestTier } from "@/lib/permissions";
import { supabaseAdmin } from "@/lib/supabase/server";
import { ApiError } from "@/lib/api/respond";

/**
 * Setup options — supports switching between any guild the user owns/manages.
 * `selectedGuildId` picks which guild's channels/roles to return.
 */
export async function getSetupOptions(userId: string, selectedGuildId?: string) {
  const manageable = await getManageableGuilds(userId);
  if (!manageable.length) {
    throw new ApiError("forbidden", "서버 소유자 또는 서버 관리 권한자만 설정할 수 있습니다.", 403);
  }
  const config = await getConfig();

  let targetId = selectedGuildId && manageable.find((g) => g.id === selectedGuildId)?.id;
  if (!targetId) targetId = manageable.find((g) => g.id === config.guildId)?.id ?? manageable[0].id;
  const guild = manageable.find((g) => g.id === targetId)!;

  const [channels, roles] = await Promise.all([listGuildChannels(guild.id), listGuildRoles(guild.id)]);
  const roleOptions = roles.map((r) => {
    let tier: "admin" | "reviewer" | "member" | "none" = "none";
    if (config.adminRoleIds.includes(r.id)) tier = "admin";
    else if (config.reviewerRoleIds.includes(r.id)) tier = "reviewer";
    else if (config.memberRoleIds.includes(r.id)) tier = "member";
    else tier = suggestTier(r.permissions);
    return { id: r.id, name: r.name, suggestedTier: tier };
  });

  return {
    setupCompleted: config.setupCompleted,
    manageableGuilds: manageable,
    guild,
    channels,
    roles: roleOptions,
    config: { notifyChannelId: config.notifyChannelId },
  };
}

export type SetupInput = {
  guildId: string;
  notifyChannelId?: string;
  roleTiers?: Record<string, "admin" | "reviewer" | "member" | "none">;
};

export async function saveSetup(userId: string, input: SetupInput) {
  const guildId = (input.guildId ?? "").trim();
  if (!guildId) throw new ApiError("invalid", "서버 ID가 필요합니다.");

  const manageable = await getManageableGuilds(userId);
  const target = manageable.find((g) => g.id === guildId);
  if (!target) {
    throw new ApiError("forbidden", "서버 소유자 또는 서버 관리 권한자만 설정할 수 있습니다.", 403);
  }

  const adminRoleIds: string[] = [];
  const reviewerRoleIds: string[] = [];
  const memberRoleIds: string[] = [];
  for (const [roleId, tier] of Object.entries(input.roleTiers ?? {})) {
    if (tier === "admin") adminRoleIds.push(roleId);
    else if (tier === "reviewer") reviewerRoleIds.push(roleId);
    else if (tier === "member") memberRoleIds.push(roleId);
  }

  const { error } = await saveConfig(
    {
      guildId,
      guildName: target.name,
      notifyChannelId: input.notifyChannelId ?? "",
      adminRoleIds,
      reviewerRoleIds,
      memberRoleIds,
    },
    userId,
    true,
  );
  if (error) throw new ApiError("db", "저장에 실패했습니다.", 500);

  await supabaseAdmin().from("audit_log").insert({
    actor_id: userId,
    action: "setup.save",
    target_type: "app_config",
    target_id: guildId,
  });
  return { ok: true };
}

/** Guild channels + roles for the form builder (discord intake channel, grant role). */
export async function getDiscordMeta() {
  const config = await getConfig();
  if (!config.guildId) return { channels: [], roles: [] };
  const [channels, roles] = await Promise.all([
    listGuildChannels(config.guildId),
    listGuildRoles(config.guildId),
  ]);
  return {
    channels,
    roles: roles.map((r) => ({ id: r.id, name: r.name })),
  };
}
