import { cache } from "react";
import { supabaseAdmin } from "@/lib/supabase/server";
import { env } from "@/lib/env";

/**
 * Runtime Discord integration config (DB-backed, managed via /setup).
 * Secrets stay in env. Per-form settings (channels, approval actions) live on
 * each form, not here.
 */
export type AppConfig = {
  guildId: string;
  guildName: string;
  notifyChannelId: string;
  certChannelId: string;
  adminRoleIds: string[];
  reviewerRoleIds: string[];
  memberRoleIds: string[];
  setupCompleted: boolean;
  weeklyResetAt: string | null;
};

const EMPTY: AppConfig = {
  guildId: "",
  guildName: "",
  notifyChannelId: "",
  certChannelId: "",
  adminRoleIds: [],
  reviewerRoleIds: [],
  memberRoleIds: [],
  setupCompleted: false,
  weeklyResetAt: null,
};

/** Read the single config row. Memoized per request. Returns defaults if absent. */
export const getConfig = cache(async (): Promise<AppConfig> => {
  // 잠금 길드가 설정되면 DB 값과 무관하게 항상 이 길드로 고정한다(테넌트 lock).
  const locked = env.lockedGuildId;
  try {
    const { data } = await supabaseAdmin()
      .from("app_config")
      .select("*")
      .eq("id", "default")
      .maybeSingle();
    if (!data) return { ...EMPTY, guildId: locked || EMPTY.guildId };
    return {
      guildId: locked || (data.guild_id ?? ""),
      guildName: data.guild_name ?? "",
      notifyChannelId: data.notify_channel_id ?? "",
      certChannelId: data.cert_channel_id ?? "",
      adminRoleIds: data.admin_role_ids ?? [],
      reviewerRoleIds: data.reviewer_role_ids ?? [],
      memberRoleIds: data.member_role_ids ?? [],
      setupCompleted: !!data.setup_completed,
      weeklyResetAt: data.weekly_reset_at ?? null,
    };
  } catch (e) {
    console.error("[config] read failed:", e);
    return { ...EMPTY, guildId: locked || EMPTY.guildId };
  }
});

/** Persist the config (called by /setup). */
export async function saveConfig(
  c: Omit<AppConfig, "setupCompleted" | "weeklyResetAt">,
  updatedBy: string,
  setupCompleted = true,
) {
  return supabaseAdmin()
    .from("app_config")
    .upsert(
      {
        id: "default",
        guild_id: c.guildId || null,
        guild_name: c.guildName || null,
        notify_channel_id: c.notifyChannelId || null,
        cert_channel_id: c.certChannelId || null,
        admin_role_ids: c.adminRoleIds,
        reviewer_role_ids: c.reviewerRoleIds,
        member_role_ids: c.memberRoleIds,
        setup_completed: setupCompleted,
        updated_by: updatedBy,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "id" },
    );
}

/** Set the weekly certification reset baseline (admin reset action). */
export async function setWeeklyResetAt(iso: string, updatedBy: string) {
  return supabaseAdmin()
    .from("app_config")
    .update({ weekly_reset_at: iso, updated_by: updatedBy, updated_at: new Date().toISOString() })
    .eq("id", "default");
}
