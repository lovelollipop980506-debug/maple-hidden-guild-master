import { getConfig, saveConfig } from "@/lib/config";
import {
  getManageableGuilds,
  getBotGuilds,
  canManageGuild,
  getUserGuildStanding,
  listGuildChannels,
  listGuildRoles,
  botInviteUrl,
  sendChannelMessage,
} from "@/lib/discord";
import { OPEN_PREFIX } from "@/lib/discord-interactions";
import { suggestTier } from "@/lib/permissions";
import { supabaseAdmin } from "@/lib/supabase/server";
import { ApiError } from "@/lib/api/respond";
import { env } from "@/lib/env";

const CERT_FORM_KEY = "skill_cert";

/**
 * 부트스트랩 상태 — 잠금(또는 설정) 길드에 봇이 들어와 있는지.
 * 봇이 없으면 누구도 admin 으로 식별될 수 없으므로(소유자/역할 조회가 봇 토큰 기반),
 * 로그인한 사용자에게 "봇 초대" 화면을 먼저 띄우는 게이트에서 쓴다. 권한 무관(로그인만).
 */
export async function getBootstrapStatus(accessToken?: string) {
  const config = await getConfig();
  const guildId = env.lockedGuildId || config.guildId;
  const base = { guildId, inviteUrl: botInviteUrl(guildId || undefined), locked: !!env.lockedGuildId };
  // 설정 완료됐다면 봇은 반드시 들어와 있다(셋업이 봇을 요구) → Discord 호출 생략(정상 운영 지연 0).
  if (config.setupCompleted && guildId) {
    return { ...base, botReady: true, member: true, canInvite: false, standingUnknown: false };
  }
  let botReady = false;
  if (guildId) {
    const bots = await getBotGuilds();
    botReady = bots.some((g) => g.id === guildId);
  }
  // 봇 초대 전에도 사용자 OAuth 토큰으로 "이 사람이 이 서버에 봇을 초대할 권한이 있는지" 판별.
  const standing = guildId
    ? await getUserGuildStanding(accessToken ?? "", guildId)
    : { member: false, canManage: false, unknown: !!accessToken ? false : true };
  return {
    ...base,
    botReady,
    member: standing.member,
    canInvite: standing.canManage,
    standingUnknown: standing.unknown,
  };
}

/**
 * Setup options — supports switching between any guild the user owns/manages.
 * `selectedGuildId` picks which guild's channels/roles to return.
 */
export async function getSetupOptions(userId: string, selectedGuildId?: string) {
  const locked = env.lockedGuildId;
  // 잠금 길드가 있으면 그 길드만 대상으로 한다(다른 서버로 셋업 전환 불가).
  let manageable = await getManageableGuilds(userId);
  if (locked) manageable = manageable.filter((g) => g.id === locked);
  if (!manageable.length) {
    throw new ApiError(
      "forbidden",
      locked
        ? "이 시스템은 지정된 길드 전용입니다. 해당 서버의 소유자/관리 권한자만, 봇이 초대된 상태에서 설정할 수 있습니다."
        : "서버 소유자 또는 서버 관리 권한자만 설정할 수 있습니다.",
      403,
    );
  }
  const config = await getConfig();

  let targetId = locked || (selectedGuildId && manageable.find((g) => g.id === selectedGuildId)?.id);
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
    // manageable 은 (봇이 속한 길드 ∩ 사용자가 관리하는 길드)라, 여기 뜨는 서버는 봇이 이미 있음.
    botPresent: true,
    inviteUrl: botInviteUrl(guild.id), // 연동 서버 한정 (재)초대 링크 — 봇 권한/스코프 업데이트용
    channels,
    roles: roleOptions,
    config: { notifyChannelId: config.notifyChannelId, certChannelId: config.certChannelId },
  };
}

export type SetupInput = {
  guildId: string;
  notifyChannelId?: string;
  certChannelId?: string;
  roleTiers?: Record<string, "admin" | "reviewer" | "member" | "none">;
};

export async function saveSetup(userId: string, input: SetupInput) {
  const locked = env.lockedGuildId;
  // 잠금 길드가 있으면 입력값과 무관하게 항상 그 길드로 저장한다(테넌트 lock).
  const guildId = locked || (input.guildId ?? "").trim();
  if (!guildId) throw new ApiError("invalid", "서버 ID가 필요합니다.");

  const manageable = await getManageableGuilds(userId);
  const target = manageable.find((g) => g.id === guildId);
  if (!target) {
    throw new ApiError(
      "forbidden",
      locked
        ? "이 시스템은 지정된 길드 전용입니다. 해당 서버의 소유자/관리 권한자만 설정할 수 있습니다."
        : "서버 소유자 또는 서버 관리 권한자만 설정할 수 있습니다.",
      403,
    );
  }

  const adminRoleIds: string[] = [];
  const reviewerRoleIds: string[] = [];
  const memberRoleIds: string[] = [];
  for (const [roleId, tier] of Object.entries(input.roleTiers ?? {})) {
    if (tier === "admin") adminRoleIds.push(roleId);
    else if (tier === "reviewer") reviewerRoleIds.push(roleId);
    else if (tier === "member") memberRoleIds.push(roleId);
  }

  // 제공 안 된 채널 값은 기존 설정을 유지(다른 항목만 저장해도 안 지워지게).
  const config = await getConfig();
  const { error } = await saveConfig(
    {
      guildId,
      guildName: target.name,
      notifyChannelId: input.notifyChannelId ?? config.notifyChannelId,
      certChannelId: input.certChannelId ?? config.certChannelId,
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

/**
 * 인증 채널에 "스킬업 인증하기" 버튼 메시지를 게시한다. 버튼 클릭 → 모달 → 제출은
 * 기존 Interactions 엔드포인트가 처리(custom_id `form_open:skill_cert`).
 * 서버 관리 권한자만 가능. 채널 인자가 없으면 저장된 인증 채널을 사용.
 */
export async function postCertPanel(userId: string, channelId?: string) {
  const config = await getConfig();
  const guildId = env.lockedGuildId || config.guildId;
  if (!guildId || !(await canManageGuild(guildId, userId))) {
    throw new ApiError("forbidden", "서버 관리 권한자만 인증 버튼을 게시할 수 있습니다.", 403);
  }
  const target = (channelId || config.certChannelId || "").trim();
  if (!target) throw new ApiError("invalid", "인증 채널을 먼저 선택해 주세요.");

  const okSent = await sendChannelMessage(target, {
    embeds: [
      {
        title: "🎯 스킬업 인증",
        description: "아래 버튼을 눌러 스킬업을 인증하세요.\n운영진 승인 후 누적 스킬업과 이번 주 현황에 반영됩니다.",
        color: 0x5865f2,
      },
    ],
    components: [
      {
        type: 1, // Action Row
        components: [
          { type: 2, style: 1, label: "스킬업 인증하기", custom_id: OPEN_PREFIX + CERT_FORM_KEY }, // Primary Button
        ],
      },
    ],
  });
  if (!okSent) throw new ApiError("discord", "메시지 게시에 실패했습니다. 봇 권한(메시지 보내기)·채널을 확인해 주세요.", 502);

  await supabaseAdmin().from("audit_log").insert({
    actor_id: userId,
    action: "setup.cert_panel",
    target_type: "channel",
    target_id: target,
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
