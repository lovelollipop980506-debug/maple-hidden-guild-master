import { cache } from "react";
import { supabaseAdmin } from "@/lib/supabase/server";

/**
 * Runtime Discord integration config, stored in the DB and managed via the
 * in-app /setup bootstrap. Secrets (client id/secret, bot token, supabase keys)
 * remain in env; everything selectable (guild, channels, role mappings) lives here
 * so the person receiving this app can configure it without editing files.
 */
export type AppConfig = {
  guildId: string;
  sourceChannelIds: string[];
  notifyChannelId: string;
  approvedMemberRoleId: string;
  adminRoleIds: string[];
  reviewerRoleIds: string[];
  memberRoleIds: string[];
  setupCompleted: boolean;
};

const EMPTY: AppConfig = {
  guildId: "",
  sourceChannelIds: [],
  notifyChannelId: "",
  approvedMemberRoleId: "",
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
      sourceChannelIds: data.source_channel_ids ?? [],
      notifyChannelId: data.notify_channel_id ?? "",
      approvedMemberRoleId: data.approved_member_role_id ?? "",
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

/** Persist the config (called by the /setup bootstrap). */
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
        source_channel_ids: c.sourceChannelIds,
        notify_channel_id: c.notifyChannelId || null,
        approved_member_role_id: c.approvedMemberRoleId || null,
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
