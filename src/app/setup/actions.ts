"use server";

import { revalidatePath } from "next/cache";
import { getSession } from "@/lib/session";
import { getConfig, saveConfig } from "@/lib/config";
import { getManageableGuilds, canManageGuild } from "@/lib/discord";
import { supabaseAdmin } from "@/lib/supabase/server";

export async function saveSetup(formData: FormData) {
  const session = await getSession();
  if (!session?.user?.discordId) return { ok: false, error: "로그인이 필요합니다." };
  const me = session.user.discordId;

  const guildId = String(formData.get("guildId") ?? "").trim();
  if (!guildId) return { ok: false, error: "서버를 찾을 수 없습니다." };

  const config = await getConfig();

  // Authorization: guild owner or Manage Server permission holder (live check).
  if (config.setupCompleted) {
    if (!(await canManageGuild(guildId, me))) {
      return { ok: false, error: "권한이 없습니다." };
    }
  } else {
    const manageable = await getManageableGuilds(me);
    if (!manageable.some((g) => g.id === guildId)) {
      return { ok: false, error: "서버 소유자 또는 서버 관리 권한자만 설정할 수 있습니다." };
    }
  }

  const sourceChannelIds = formData.getAll("source").map(String).filter(Boolean);
  const notifyChannelId = String(formData.get("notify") ?? "");
  const approvedMemberRoleId = String(formData.get("approved") ?? "");

  const adminRoleIds: string[] = [];
  const reviewerRoleIds: string[] = [];
  const memberRoleIds: string[] = [];
  for (const [key, value] of formData.entries()) {
    if (!key.startsWith("role:") || typeof value !== "string") continue;
    const roleId = key.slice("role:".length);
    if (value === "admin") adminRoleIds.push(roleId);
    else if (value === "reviewer") reviewerRoleIds.push(roleId);
    else if (value === "member") memberRoleIds.push(roleId);
  }

  const { error } = await saveConfig(
    {
      guildId,
      sourceChannelIds,
      notifyChannelId,
      approvedMemberRoleId,
      adminRoleIds,
      reviewerRoleIds,
      memberRoleIds,
    },
    me,
    true,
  );
  if (error) return { ok: false, error: "저장에 실패했습니다." };

  await supabaseAdmin().from("audit_log").insert({
    actor_id: me,
    action: "setup.save",
    target_type: "app_config",
    target_id: guildId,
  });

  revalidatePath("/setup");
  revalidatePath("/");
  return { ok: true };
}
