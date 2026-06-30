import { cache } from "react";
import { supabaseAdmin } from "@/lib/supabase/server";

/**
 * Runtime Discord integration config (DB-backed, managed via /setup).
 * Secrets stay in env. Per-form settings (channels, approval actions) live on
 * each form, not here.
 */
export type AppConfig = {
  guildId: string;
  guildName: string;
  notifyChannelId: string;
  adminRoleIds: string[];
  reviewerRoleIds: string[];
  memberRoleIds: string[];
  setupCompleted: boolean;
};

const EMPTY: AppConfig = {
  guildId: "",
  guildName: "",
  notifyChannelId: "",
  adminRoleIds: [],
  reviewerRoleIds: [],
  memberRoleIds: [],
  setupCompleted: false,
};

/** Read the single config row. Memoized per request. Returns defaults if absent. */
export const getConfig = cache(async (): Promise<AppConfig> => {
  try {
    const { data } = await supabaseAdmin()
      .from("app_config")
      .select("*")
      .eq("id", "default")
      .maybeSingle();
    if (!data) return EMPTY;
    return {
      guildId: data.guild_id ?? "",
      guildName: data.guild_name ?? "",
      notifyChannelId: data.notify_channel_id ?? "",
      adminRoleIds: data.admin_role_ids ?? [],
      reviewerRoleIds: data.reviewer_role_ids ?? [],
      memberRoleIds: data.member_role_ids ?? [],
      setupCompleted: !!data.setup_completed,
    };
  } catch (e) {
    console.error("[config] read failed:", e);
    return EMPTY;
  }
});

/** Persist the config (called by /setup). */
export async function saveConfig(
  c: Omit<AppConfig, "setupCompleted">,
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
